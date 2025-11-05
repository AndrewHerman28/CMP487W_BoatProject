document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('media.html')) {
        initMediaPage();
    }

    // if (path.includes('media.html')) {
    //     initMediaPage();
    // }
});

const btn = document.getElementById("currentProjectBtn");
if (btn) {
    btn.addEventListener("click", () => {
        window.location.href = "blog.html";
    });
}

const signinMsg = document.getElementById("signinMessage");
if (signinMsg) {
    signinMsg.innerText = "Signing in...";
    setTimeout(() => {
        window.location.replace("index.html");
    }, 1000);
}


function initMediaPage() {
    fetch('input_media.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('mediaContainer');

            data.forEach(item => {
                const section = document.createElement('section');
                section.className = 'media-item';

                section.innerHTML = `
        <a href="${item.link}" target="_blank">
          <img src="${item.image}" alt="${item.title}">
        </a>
        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
        <p>${item.description}</p>
      `;

                container.appendChild(section);
            });
        })
        .catch(error => {
            console.error('Error loading media:', error);
        });
}


function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

