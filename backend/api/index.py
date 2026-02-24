from mangum import Mangum
from main import app  # noqa

handler = Mangum(app, lifespan="off")
