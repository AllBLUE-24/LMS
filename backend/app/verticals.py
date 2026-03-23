import importlib
import logging
import os

from fastapi import FastAPI

logger = logging.getLogger(__name__)


def register_vertical_routers(app: FastAPI):
    """
    Dynamically discovers and registers routers from the active vertical.
    """
    vertical_name = os.environ.get("ACTIVE_VERTICAL")

    if not vertical_name:
        logger.info("No active vertical is set. Skipping vertical router loading.")
        return

    logger.info(f"Active vertical is '{vertical_name}'. Loading routers...")

    try:
        # Dynamically construct the module name for the vertical's api
        vertical_api_module_name = f"verticals.{vertical_name}.api"
        vertical_api_module = importlib.import_module(vertical_api_module_name)

        # Get the list of routers from the vertical's api module
        routers = getattr(vertical_api_module, "all_routers", [])
        if not routers:
            logger.warning(
                f"No 'all_routers' list found in {vertical_api_module_name}."
            )
            return

        for router_config in routers:
            router = router_config["router"]
            prefix = router_config["prefix"]
            tags = router_config["tags"]
            app.include_router(router, prefix=prefix, tags=tags)
            logger.info(
                f"Successfully registered router from vertical '{vertical_name}' with prefix '{prefix}'."
            )

    except ImportError:
        logger.error(
            f"Could not import module 'api' from vertical '{vertical_name}'. "
            f"Please ensure the vertical is correctly structured."
        )
    except AttributeError:
        logger.error(
            f"An error occurred while trying to register routers from vertical '{vertical_name}'."
        )
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
