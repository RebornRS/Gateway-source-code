document.addEventListener("DOMContentLoaded", function() {
    fetch("./inc/header.html")
        .then(response => response.text())
        .then(menuHtml => {
            const firstNavElement = document.querySelector("nav");
            if (firstNavElement) {
                firstNavElement.innerHTML = menuHtml;
            }
        });
  });