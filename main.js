
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('media.html')) {
      initMediaPage();
  }

});

const btn = document.getElementById("currentProjectBtn");
if (btn) {
  btn.addEventListener("click", () => {
      window.location.href = "blog.html";
  });
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
      <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
      <p>${item.date}</p>
      <a href="${item.link}" target="_blank"> <img src="${item.image}" alt="${item.title}"></a>
      <p>${item.description}</p>
    `;

              container.appendChild(section);
          });
      })
      .catch(error => {
          console.error('Error loading media:', error);
      });
}
