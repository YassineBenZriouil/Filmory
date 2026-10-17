// Colours are CSS variables (see src/style/global.css), so one class covers both themes.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
    darkMode: "class",
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                booth: token("booth"),
                leader: token("leader"),
                reel: token("reel"),
                grain: token("grain"),
                screen: token("screen"),
                beam: token("beam"),
                velvet: token("velvet"),
                house: token("house"),
                ink: token("ink"),
            },
            fontFamily: {
                display: ['"Big Shoulders Display"', "sans-serif"],
                body: ['"Atkinson Hyperlegible"', "sans-serif"],
            },
            maxWidth: {
                content: "1320px",
            },
            transitionDuration: {
                blink: "90ms",
                quick: "160ms",
                move: "280ms",
                frame: "420ms",
            },
            transitionTimingFunction: {
                out: "cubic-bezier(.2,.8,.2,1)",
                in: "cubic-bezier(.4,0,1,1)",
                reel: "cubic-bezier(.65,0,.35,1)",
            },
        },
    },
    plugins: [],
};
