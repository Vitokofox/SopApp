import os

import uvicorn


if __name__ == "__main__":
    uvicorn.run("app.main:app", host=os.getenv("SOP_HOST", "0.0.0.0"), port=int(os.getenv("SOP_PORT", "8090")), reload=False)
