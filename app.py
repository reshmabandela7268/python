from flask import Flask, render_template, request, redirect, url_for, flash
from flask_mail import Mail, Message

app = Flask(__name__)  
app.secret_key = "your_secret_key"

# Mail configuration (replace with your Gmail + app password)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = "your_email@gmail.com"   # change this
app.config['MAIL_PASSWORD'] = "your_app_password"      # change this

mail = Mail(app)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/contact", methods=["POST"])
def contact():
    name = request.form.get("name")
    email = request.form.get("email")
    message = request.form.get("message")

    if not name or not email or not message:
        flash("All fields are required!", "danger")
        return redirect(url_for("home"))

    # Save to local file
    with open("messages.txt", "a") as f:
        f.write(f"Name: {name}\nEmail: {email}\nMessage: {message}\n{'-'*40}\n")

    try:
        msg = Message(
            subject="New Internship Finder Message",
            sender=app.config['MAIL_USERNAME'],
            recipients=[app.config['MAIL_USERNAME']],
            body=f"From: {name} <{email}>\n\n{message}"
        )
        mail.send(msg)
        flash("✅ Message sent successfully!", "success")
    except Exception as e:
        flash(f"⚠ Saved but email not sent: {str(e)}", "warning")

    return redirect(url_for("home"))

if __name__ == "_main_":
    app.run(debug=True)
