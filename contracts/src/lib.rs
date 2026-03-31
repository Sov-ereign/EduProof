#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Bytes, BytesN, Env, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EduProofError {
    AlreadyInitialized = 1,
    Unauthorized = 2,
    AlreadyExists = 3,
    NotFound = 4,
    EvaluatorRevoked = 5,
    InvalidScore = 6,
}

#[contracttype]
#[derive(Clone)]
pub struct Evaluator {
    pub signer: BytesN<32>,
    pub active: bool,
    pub registered_at: u64,
    pub revoked_at: Option<u64>,
}

#[contracttype]
#[derive(Clone)]
pub struct EvaluationArtifact {
    pub artifact_hash: BytesN<32>,
    pub repository_snapshot_hash: BytesN<32>,
    pub rubric_version: Bytes,
    pub prompt_version: Bytes,
    pub model_id: Bytes,
    pub score: u32,
    pub artifact_uri: Bytes,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Attestation {
    pub attestation_id: BytesN<32>,
    pub user: Address,
    pub signer: BytesN<32>,
    pub artifact_hash: BytesN<32>,
    pub rubric_version: Bytes,
    pub model_id: Bytes,
    pub signature: BytesN<64>,
    pub created_at: u64,
    pub revoked: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct AttestationSubmission {
    pub attestation_id: BytesN<32>,
    pub user: Address,
    pub signer: BytesN<32>,
    pub artifact_hash: BytesN<32>,
    pub repository_snapshot_hash: BytesN<32>,
    pub rubric_version: Bytes,
    pub prompt_version: Bytes,
    pub model_id: Bytes,
    pub score: u32,
    pub artifact_uri: Bytes,
    pub signature: BytesN<64>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Evaluator(BytesN<32>),
    Artifact(BytesN<32>),
    Attestation(BytesN<32>),
    UserAttestations(Address),
}

#[contract]
pub struct EduProofContract;

#[contractimpl]
impl EduProofContract {
    pub fn init(env: Env, admin: Address) -> Result<(), EduProofError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(EduProofError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn register_evaluator(env: Env, signer: BytesN<32>) -> Result<(), EduProofError> {
        let admin = Self::read_admin(&env)?;
        admin.require_auth();

        let key = DataKey::Evaluator(signer.clone());
        if env.storage().persistent().has(&key) {
            return Err(EduProofError::AlreadyExists);
        }

        let evaluator = Evaluator {
            signer: signer.clone(),
            active: true,
            registered_at: env.ledger().timestamp(),
            revoked_at: None,
        };

        env.storage().persistent().set(&key, &evaluator);
        env.events()
            .publish((Symbol::new(&env, "evaluator_registered"),), signer);
        Ok(())
    }

    pub fn revoke_evaluator(env: Env, signer: BytesN<32>) -> Result<(), EduProofError> {
        let admin = Self::read_admin(&env)?;
        admin.require_auth();

        let key = DataKey::Evaluator(signer.clone());
        let mut evaluator: Evaluator = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EduProofError::NotFound)?;
        evaluator.active = false;
        evaluator.revoked_at = Some(env.ledger().timestamp());
        env.storage().persistent().set(&key, &evaluator);

        env.events()
            .publish((Symbol::new(&env, "evaluator_revoked"),), signer);
        Ok(())
    }

    pub fn submit_attestation(env: Env, submission: AttestationSubmission) -> Result<(), EduProofError> {
        if submission.score > 100 {
            return Err(EduProofError::InvalidScore);
        }

        let evaluator_key = DataKey::Evaluator(submission.signer.clone());
        let evaluator: Evaluator = env
            .storage()
            .persistent()
            .get(&evaluator_key)
            .ok_or(EduProofError::NotFound)?;
        if !evaluator.active {
            return Err(EduProofError::EvaluatorRevoked);
        }

        let attestation_key = DataKey::Attestation(submission.attestation_id.clone());
        if env.storage().persistent().has(&attestation_key) {
            return Err(EduProofError::AlreadyExists);
        }

        let mut signed_message = Bytes::new(&env);
        signed_message.append(&Bytes::from_array(&env, &submission.artifact_hash.to_array()));
        env.crypto()
            .ed25519_verify(&submission.signer, &signed_message, &submission.signature);

        let artifact_key = DataKey::Artifact(submission.artifact_hash.clone());
        let artifact = EvaluationArtifact {
            artifact_hash: submission.artifact_hash.clone(),
            repository_snapshot_hash: submission.repository_snapshot_hash,
            rubric_version: submission.rubric_version.clone(),
            prompt_version: submission.prompt_version,
            model_id: submission.model_id.clone(),
            score: submission.score,
            artifact_uri: submission.artifact_uri,
            created_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&artifact_key, &artifact);

        let attestation = Attestation {
            attestation_id: submission.attestation_id.clone(),
            user: submission.user.clone(),
            signer: submission.signer.clone(),
            artifact_hash: submission.artifact_hash.clone(),
            rubric_version: submission.rubric_version,
            model_id: submission.model_id,
            signature: submission.signature,
            created_at: env.ledger().timestamp(),
            revoked: false,
        };
        env.storage().persistent().set(&attestation_key, &attestation);

        let user_key = DataKey::UserAttestations(submission.user.clone());
        let mut attestation_ids: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(Vec::new(&env));
        attestation_ids.push_back(submission.attestation_id.clone());
        env.storage().persistent().set(&user_key, &attestation_ids);

        env.events().publish(
            (Symbol::new(&env, "attestation_submitted"), submission.user),
            submission.attestation_id,
        );
        Ok(())
    }

    pub fn verify_attestation(env: Env, attestation_id: BytesN<32>) -> Result<bool, EduProofError> {
        let attestation_key = DataKey::Attestation(attestation_id);
        let attestation: Attestation = env
            .storage()
            .persistent()
            .get(&attestation_key)
            .ok_or(EduProofError::NotFound)?;
        if attestation.revoked {
            return Ok(false);
        }

        let evaluator_key = DataKey::Evaluator(attestation.signer.clone());
        let evaluator: Evaluator = env
            .storage()
            .persistent()
            .get(&evaluator_key)
            .ok_or(EduProofError::NotFound)?;
        if !evaluator.active {
            return Ok(false);
        }

        let artifact_key = DataKey::Artifact(attestation.artifact_hash.clone());
        if !env.storage().persistent().has(&artifact_key) {
            return Ok(false);
        }

        let mut signed_message = Bytes::new(&env);
        signed_message.append(&Bytes::from_array(&env, &attestation.artifact_hash.to_array()));
        env.crypto()
            .ed25519_verify(&attestation.signer, &signed_message, &attestation.signature);

        Ok(true)
    }

    pub fn get_attestations_by_user(
        env: Env,
        user: Address,
    ) -> Result<Vec<Attestation>, EduProofError> {
        let key = DataKey::UserAttestations(user);
        let attestation_ids: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env));

        let mut out: Vec<Attestation> = Vec::new(&env);
        for i in 0..attestation_ids.len() {
            let id = attestation_ids.get(i).ok_or(EduProofError::NotFound)?;
            let attestation: Attestation = env
                .storage()
                .persistent()
                .get(&DataKey::Attestation(id))
                .ok_or(EduProofError::NotFound)?;
            out.push_back(attestation);
        }

        Ok(out)
    }

    fn read_admin(env: &Env) -> Result<Address, EduProofError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(EduProofError::Unauthorized)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{BytesN, Env};

    fn random_signer(env: &Env, value: u8) -> BytesN<32> {
        let bytes = [value; 32];
        BytesN::from_array(env, &bytes)
    }

    #[test]
    fn evaluator_register_and_revoke_flow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, EduProofContract);
        let client = EduProofContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init(&admin);

        let signer = random_signer(&env, 7);
        client.register_evaluator(&signer);
        let active = client.verify_attestation(&BytesN::from_array(&env, &[1; 32]));
        assert_eq!(active.is_err(), true);

        client.revoke_evaluator(&signer);
    }

    #[test]
    fn supports_multiple_evaluator_lifecycle_transitions() {
        let env = Env::default();
        let contract_id = env.register_contract(None, EduProofContract);
        let client = EduProofContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init(&admin);

        for i in 1..5 {
            let signer = random_signer(&env, i);
            client.register_evaluator(&signer);
            client.revoke_evaluator(&signer);
        }
    }
}
