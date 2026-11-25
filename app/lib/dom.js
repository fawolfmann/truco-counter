// Tiny DOM builders. Never parse HTML strings (team names are user text) and never set inline styles (CSP).
const SVG_NS = "http://www.w3.org/2000/svg";

function apply(element, props) {
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false || key === "style") continue;
    if (key === "class") element.setAttribute("class", value);
    else if (key.startsWith("on") && typeof value === "function") element.addEventListener(key.slice(2).toLowerCase(), value);
    else element.setAttribute(key, value === true ? "" : String(value));
  }
  return element;
}

function append(element, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

/** h('button', { class: 'x', onclick }, 'text', childNode) -> HTMLElement */
export const h = (tag, props, ...children) => append(apply(document.createElement(tag), props), children);

/** Same for SVG elements. */
export const s = (tag, props, ...children) => append(apply(document.createElementNS(SVG_NS, tag), props), children);
