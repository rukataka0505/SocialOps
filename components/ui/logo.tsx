"use client";

import { motion } from "framer-motion";

export function Logo({ className }: { className?: string }) {
    return (
        <motion.div
            className={`relative w-8 h-8 flex items-center justify-center ${className}`}
            whileHover="hover"
            initial="initial"
        >
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                {/* Background Shape */}
                <motion.rect
                    x="2"
                    y="2"
                    width="28"
                    height="28"
                    rx="8"
                    className="fill-primary"
                    variants={{
                        initial: { rotate: 0, scale: 1 },
                        hover: { rotate: 90, scale: 0.9, transition: { type: "spring", stiffness: 300, damping: 15 } }
                    }}
                />

                {/* Inner Symbol - Abstract 'S' or Digital Atelier mark */}
                <motion.path
                    d="M10 10H22V14H14V18H22V22H10V18H18V14H10V10Z"
                    fill="white"
                    variants={{
                        initial: { opacity: 1, scale: 1 },
                        hover: { opacity: 0, scale: 0.5 }
                    }}
                />

                {/* Hover Reveal Symbol */}
                <motion.circle
                    cx="16"
                    cy="16"
                    r="4"
                    fill="white"
                    initial={{ opacity: 0, scale: 0 }}
                    variants={{
                        hover: { opacity: 1, scale: 1, transition: { delay: 0.1 } }
                    }}
                />
            </svg>
        </motion.div>
    );
}
