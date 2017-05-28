// Load items
var katexCSS = document.createElement('link');
katexCSS.rel = "stylesheet";
katexCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.css";
katexCSS.integrity = "sha384-wITovz90syo1dJWVh32uuETPVEtGigN07tkttEqPv+uR2SE/mbQcG7ATL28aI9H0";
katexCSS.setAttribute("crossorigin", "anonymous");

var katex = document.createElement('script');
katex.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.js";
katex.integrity = "sha384-/y1Nn9+QQAipbNQWU65krzJralCnuOasHncUFXGkdwntGeSvQicrYkiUBwsgUqc1";
katex.setAttribute("crossorigin", "anonymous");

var katexAutoRender = document.createElement('script');
katexAutoRender.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/contrib/auto-render.min.js";
katexAutoRender.integrity = "sha384-dq1/gEHSxPZQ7DdrM82ID4YVol9BYyU7GbWlIwnwyPzotpoc57wDw/guX8EaYGPx";
katexAutoRender.setAttribute("crossorigin", "anonymous");


document.head.appendChild(katexCSS);
document.head.appendChild(katex);
document.head.appendChild(katexAutoRender);

var finishLoad = false;
var domLoaded = false;

katexAutoRender.onload = function() { finishLoad = true; readyRender(); }
document.addEventListener("DOMContentLoaded", function() { domLoaded = true; readyRender(); });

function readyRender() {
    if (finishLoad && domLoaded) renderMathInElement(document.body);
}