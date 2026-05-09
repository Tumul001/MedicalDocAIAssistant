"""
api_manager.py
Manages multi-key rotation for Groq and Voyage AI.
Uses itertools.cycle for infinite round-robin rotation.
"""

import os
import itertools
import time
from dotenv import load_dotenv

load_dotenv()


class APIKeyManager:
    """
    Rotates through a list of API keys.
    On rate-limit or auth failure, auto-advances to the next key.
    """

    def __init__(self, env_var: str, service_name: str):
        raw = os.getenv(env_var, "")
        keys = [k.strip() for k in raw.split(",") if k.strip()]

        if not keys:
            raise ValueError(
                f"[APIKeyManager] No API keys found for {service_name}. "
                f"Check your .env file for variable: {env_var}"
            )

        self.service_name = service_name
        self.keys = keys
        self._cycle = itertools.cycle(keys)
        self._current = next(self._cycle)
        print(f"[APIKeyManager] Loaded {len(keys)} key(s) for {service_name}")

    def get_key(self) -> str:
        return self._current

    def rotate(self):
        """Advance to the next key in the rotation."""
        self._current = next(self._cycle)
        print(f"[APIKeyManager] Rotated to next key for {self.service_name}")

    def call_with_retry(self, func, max_retries: int = 3):
        """
        Execute func(api_key) with automatic key rotation on failure.
        Retries up to max_retries times across different keys.
        """
        last_error = None
        for attempt in range(max_retries):
            try:
                return func(self.get_key())
            except Exception as e:
                error_str = str(e).lower()
                last_error = e
                if "429" in error_str or "rate" in error_str or "auth" in error_str:
                    print(
                        f"[APIKeyManager] Attempt {attempt + 1}/{max_retries} "
                        f"failed for {self.service_name}: {e}. Rotating key."
                    )
                    self.rotate()
                    time.sleep(1.5)
                else:
                    raise e
        raise RuntimeError(
            f"[APIKeyManager] All {max_retries} attempts failed for "
            f"{self.service_name}. Last error: {last_error}"
        )


# Singleton instances — initialized once on module load
groq_manager = APIKeyManager("GROQ_API_KEYS", "Groq")
voyage_manager = APIKeyManager("VOYAGE_API_KEYS", "VoyageAI")
