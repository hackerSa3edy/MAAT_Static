from flask import Flask, flash, redirect, url_for
from flask_jwt_extended import JWTManager

app = Flask(__name__, template_folder='maat_app/templates', static_folder='maat_app/static')
app.config['SECRET_KEY'] = r'django-insecure-%2dmqnqj9v2e&8yk*t=#b+2-=i!45+153*@-g0*=&%1od16z^m'
app.config['JWT_SECRET_KEY'] = 'JWT_S3CR3T_K3Y' # fake: jwt-secret-string
app.config['JWT_IDENTITY_CLAIM'] = 'user_id'  # Change this if you want to use a different claim
app.config['JWT_ACCESS_COOKIE_NAME'] = 'jwtAccess'
app.config['JWT_REFRESH_COOKIE_NAME'] = 'jwtRefresh'
jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized_response(callback):
    flash("You must be logged in to view this page.", category='error')
    return redirect(url_for('route_login'))

from maat_app.views import *
