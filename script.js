let db;
let auth;

const firebaseConfig = {
    apiKey: "AIzaSyBd_B8YbM3AKywHywfn0mXolb-hAGCOhjo",
    authDomain: "notedown-d43eb.firebaseapp.com",
    projectId: "notedown-d43eb",
    storageBucket: "notedown-d43eb.firebasestorage.app",
    messagingSenderId: "635460039293",
    appId: "1:635460039293:web:c8d5105d515a581cfbb714",
    measurementId: "G-8JYRPC91GF"
};

window.toggleTheme = function() {
    document.body.classList.toggle('dark-theme');
};

window.toggleConfig = function() {
    const configForm = document.getElementById('config-form');
    configForm.style.display = configForm.style.display === 'none' ? 'block' : 'none';
};

window.switchTab = function(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.auth-tab[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // Update form visibility
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tabName}-form`).classList.add('active');
};

// Initialize Firebase on page load
async function initializeApp() {
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js");
        const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js");
        
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.getElementById('auth-content').style.display = 'none';
                document.getElementById('app-content').style.display = 'block';
                loadNotes();
            } else {
                document.getElementById('auth-content').style.display = 'block';
                document.getElementById('app-content').style.display = 'none';
            }
            document.getElementById('initial-message').style.display = 'none';
        });
    } catch (error) {
        alert('Error initializing Firebase: ' + error.message);
        console.error('Firebase initialization error:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeApp);

window.saveNote = async function() {
    const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js");
    const noteContent = document.getElementById('note-content').value;
    
    if (!auth.currentUser) {
        alert("Please login first");
        return;
    }
    
    if (noteContent.trim() === "") {
        alert("Please write something before saving.");
        return;
    }

    try {
        await addDoc(collection(db, "notes"), {
            content: noteContent,
            timestamp: new Date(),
            userId: auth.currentUser.uid  // Add user ID to note
        });
        alert("Note saved successfully!");
        document.getElementById('note-content').value = '';
        loadNotes();
    } catch (error) {
        alert("Error saving note: " + error.message);
        console.error("Error adding note:", error);
    }
};

async function loadNotes() {
    const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js");
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    
    if (!auth.currentUser) return;

    try {
        // Only get notes for the current user
        const q = query(
            collection(db, "notes"), 
            where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const note = doc.data();
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.innerHTML = `
                <p>${note.content}</p>
                <div class="note-actions">
                    <button onclick="editNote('${doc.id}', '${note.content.replace(/'/g, "\\'")}')">Edit</button>
                    <button onclick="deleteNote('${doc.id}')">Delete</button>
                    <button onclick="copyNote('${note.content.replace(/'/g, "\\'")}')">Copy</button>
                </div>
            `;
            notesList.appendChild(noteCard);
        });
    } catch (error) {
        console.error("Error loading notes:", error);
        alert("Error loading notes: " + error.message);
    }
}

window.editNote = async function(id, content) {
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js");
    const newContent = prompt("Edit your note:", content);
    if (newContent !== null) {
        try {
            const noteRef = doc(db, "notes", id);
            await updateDoc(noteRef, {
                content: newContent
            });
            loadNotes();
        } catch (error) {
            alert("Error updating note: " + error.message);
            console.error("Error updating note:", error);
        }
    }
};

window.deleteNote = async function(id) {
    const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js");
    if (confirm("Are you sure you want to delete this note?")) {
        try {
            await deleteDoc(doc(db, "notes", id));
            loadNotes();
        } catch (error) {
            alert("Error deleting note: " + error.message);
            console.error("Error deleting note:", error);
        }
    }
};

window.copyNote = function(content) {
    navigator.clipboard.writeText(content)
        .then(() => alert("Note copied to clipboard!"))
        .catch(err => {
            console.error("Error copying note:", err);
            alert("Error copying note: " + err.message);
        });
};

window.signUp = async function() {
    const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js");
    const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js");
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        // Create authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
            email: email,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        alert("Account created successfully!");
    } catch (error) {
        alert("Sign up error: " + error.message);
    }
};

window.login = async function() {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js");
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert("Login error: " + error.message);
    }
};

window.logout = async function() {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js");
    try {
        await signOut(auth);
    } catch (error) {
        alert("Logout error: " + error.message);
    }
};
