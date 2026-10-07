/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./*.html",
        "./**/*.html",
        "./assets/**/*.js",
    ],

    theme: {
        extend: {
            fontSize: {
                ...Object.fromEntries(
                    Array.from(
                        { length: 42 },
                        (_, i) => {
                            const size = 18 + i * 2;
                            return [`${size}px`, `${size}px`];
                        }
                    )
                ),
            },

            fontFamily: {
                sans: [
                    "Inter",
                    "system-ui",
                    "-apple-system",
                    "Roboto",
                    "sans-serif"
                ],
            },

            colors: {
                "brand-green-light": "#F2F8F5",
                "brand-green-dark": "#48815a",
                "brand-green-trans": "#48815a38",
                "brand-green-accent": "#339763",
                "brand-navy": "#2c2645",
                "brand-orange-text": "#FFAE2F",
                "brand-guarantee-badge": "#F1F1F6",
                "brand-green-header": "#48815A",
                "brand-green-circle": "#e2f5ec",
                "brand-dark": "#212121",
                "brand-red-strike": "#d92727",
            },

            backgroundImage: {
                "cta-btn": "linear-gradient(90deg, #F48623 -8%, #FFA429 81.3%)",
                "cta-gradient": "linear-gradient(180deg, #f89d35 0%, #f37720 100%)",
                "badge-gradient": "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
                "best-value-header": "linear-gradient(99deg, #48815A 0.08%, #26B654 100%)",
            },

            boxShadow: {
                cta: "0px 2.345px 4.691px rgba(0, 0, 0, 0.16)",
                "best-value": "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            },
        },
    },

    plugins: [],
};