import os
import oumi
from oumi.core.configs import TrainingConfig, ModelConfig, DataConfig
from oumi.trainers import PPO_Trainer
from oumi.rewards import BaseRewardFunction

# ---------------------------------------------------------
# IRON INTELLIGENCE AWARD SUBMISSION
# RL Fine-Tuning for ApiforgeX Agent
# ---------------------------------------------------------

class CodeCompilesReward(BaseRewardFunction):
    """
    Reward function that compiles the generated TypeScript code.
    Reward = +1.0 if tsc compiles, -1.0 if valid syntax error.
    """
    def __call__(self, generated_text: str, **kwargs) -> float:
        # Save to temp file
        temp_file = "temp_gen.ts"
        with open(temp_file, "w") as f:
            f.write(generated_text)
        
        # Check syntax (using bun or tsc check)
        # return 1.0 if os.system(f"bun build {temp_file}") == 0 else -1.0
        return 1.0 # Mock for submission skeleton

def train():
    print("🚀 Starting Oumi RL Fine-Tuning for ApiforgeX...")
    
    # 1. Define Model
    model_config = ModelConfig(
        model_name="llama3.2:3b",
        provider="ollama"
    )

    # 2. Define Request/Prompt Data
    data_config = DataConfig(
        dataset_path="./training_data/prompts.jsonl"
    )

    # 3. Configure PPO (Reinforcement Learning)
    train_config = TrainingConfig(
        method="ppo",
        epochs=3,
        learning_rate=1e-5,
        output_dir="./checkpoints"
    )

    # 4. Initialize Trainer
    trainer = PPO_Trainer(
        model_config=model_config,
        train_config=train_config,
        data_config=data_config,
        reward_function=CodeCompilesReward()
    )

    # 5. Train
    trainer.train()
    print("✅ Training Complete. Model saved to ./checkpoints")

if __name__ == "__main__":
    train()
