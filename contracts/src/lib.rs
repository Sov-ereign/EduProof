#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EduProofError {
    AlreadyExists = 1,
    InvalidScore = 2,
    InvalidLevel = 3,
}

#[contracttype]
#[derive(Clone)]
pub struct Credential {
    pub owner: Address,
    pub skill: String,
    pub level: String, // Beginner, Intermediate, Advanced, Expert
    pub evidence: String, // URL/IPFS hash
    pub score: u32,
    pub timestamp: u64,
    pub category: String, // Tech, Writing, Design, Logic
}

#[contracttype]
pub enum DataKey {
    Credential(Address, String), // Key by User + Skill Name
    UserSkills(Address), // List of skills for a user
}

#[contract]
pub struct EduProofContract;

#[contractimpl]
impl EduProofContract {
    /// Mint a new credential or update existing one
    /// User must authorize the transaction
    pub fn mint_credential(
        env: Env,
        to: Address,
        skill: String,
        level: String,
        evidence: String,
        score: u32,
        category: String,
    ) -> Result<(), EduProofError> {
        // Validate score
        if score > 100 {
            return Err(EduProofError::InvalidScore);
        }

        // Validate level
        let valid_levels = ["Beginner", "Intermediate", "Advanced", "Expert"];
        if !valid_levels.iter().any(|&l| l == level.to_string()) {
            return Err(EduProofError::InvalidLevel);
        }

        // User must authorize
        to.require_auth();

        let key = DataKey::Credential(to.clone(), skill.clone());
        let is_update = env.storage().persistent().has(&key);

        let credential = Credential {
            owner: to.clone(),
            skill: skill.clone(),
            level,
            evidence,
            score,
            timestamp: env.ledger().timestamp(),
            category,
        };

        env.storage().persistent().set(&key, &credential);
        
        // Update user's skill list
        let skills_key = DataKey::UserSkills(to.clone());
        let mut skills: Vec<String> = if env.storage().persistent().has(&skills_key) {
            env.storage().persistent().get(&skills_key).unwrap()
        } else {
            Vec::new(&env)
        };

        // Add skill if not already in list
        let mut found = false;
        for i in 0..skills.len() {
            if skills.get(i).unwrap() == skill {
                found = true;
                break;
            }
        }
        if !found {
            skills.push_back(skill);
            env.storage().persistent().set(&skills_key, &skills);
        }
        
        // Emit event with more details
        env.events().publish(
            (Symbol::new(&env, if is_update { "update" } else { "mint" }), to), 
            credential
        );

        Ok(())
    }

    /// Get a specific credential for a user and skill
    pub fn get_credential(env: Env, user: Address, skill: String) -> Option<Credential> {
        let key = DataKey::Credential(user, skill);
        env.storage().persistent().get(&key)
    }

    /// Check if user has a credential for a skill
    pub fn has_credential(env: Env, user: Address, skill: String) -> bool {
        let key = DataKey::Credential(user, skill);
        env.storage().persistent().has(&key)
    }

    /// Get all skills for a user (returns Vec<String>)
    pub fn get_user_skills(env: Env, user: Address) -> Vec<String> {
        let key = DataKey::UserSkills(user);
        if env.storage().persistent().has(&key) {
            env.storage().persistent().get(&key).unwrap()
        } else {
            Vec::new(&env)
        }
    }
}
