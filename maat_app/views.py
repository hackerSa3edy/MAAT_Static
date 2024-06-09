from config import app
from flask import redirect, url_for,render_template, flash, get_flashed_messages, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt


@app.route('/login')
@jwt_required(optional=True, locations=['cookies'])
def route_login():
    current_user = get_jwt_identity()
    if current_user is not None:  # User is logged in
        return redirect(url_for('route_dashboard'))
    return render_template('login.html', messages=get_flashed_messages())

@app.route('/profile')
@jwt_required(locations=['cookies'])
def route_profile():
    return render_template('profile.html')

from flask import make_response

@app.route('/logout')
@jwt_required(locations=['cookies'])
def route_logout():
    response = make_response(redirect(url_for('route_login')))
    response.set_cookie('jwtAccess', '', max_age=0)
    return response


@app.route('/dashboard')
@app.route('/')
@jwt_required(locations=['cookies'])
def route_dashboard():
    claims = get_jwt()
    user_type = claims.get('user_role', 'guest')

    if user_type == 'student':
        return render_template('student_dashboard.html')
    elif user_type == 'instructor':
        return render_template('instructor_dashboard.html')
    elif user_type == 'admin':
        return render_template('admin_dashboard.html')
    else:
        return redirect(url_for('route_login'))

@app.route('/exams')
@jwt_required(locations=['cookies'])
def route_exam():
    claims = get_jwt()
    user_type = claims.get('user_role', 'guest')

    if user_type == 'student':
        return render_template('exam.html')
    else:
        abort(403, description="Access denied. This page is for students only.")
