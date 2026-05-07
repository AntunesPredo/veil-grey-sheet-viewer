import { useState } from "react";
import { motion } from "framer-motion";

interface GlitchImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  containerClassName?: string;
  glitchIntensity?: "low" | "high";
  noLoad?: boolean;
}

export function GlitchImage({
  src,
  alt,
  containerClassName = "",
  className = "",
  glitchIntensity = "low",
  noLoad = false,
  ...props
}: GlitchImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-[var(--theme-background)] flex items-center justify-center border border-[var(--theme)] ${containerClassName}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
          <span className="text-[9px] text-[var(--theme-accent)] font-mono tracking-[0.15em] animate-pulse text-nowrap">
            [ READING DATA ]
          </span>
          <div className="w-1/2 h-[1px] bg-[var(--theme-accent)]/20 overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 w-1/3 bg-[var(--theme-accent)]"
              initial={{ x: "-100%" }}
              animate={{ x: "300%" }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            />
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setTimeout(() => setIsLoaded(true), noLoad ? 0 : 1500)}
        className={`w-full h-full object-cover transition-opacity duration-500 relative z-0 ${className} ${isLoaded ? "opacity-100 grayscale-20 hover:grayscale-0" : "opacity-0"}`}
        {...props}
      />

      {isLoaded && (
        <>
          <div
            className={`glitch-layer glitch-layer-1 ${glitchIntensity === "high" ? "glitch-fast" : ""}`}
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className={`glitch-layer glitch-layer-2 ${glitchIntensity === "high" ? "glitch-fast" : ""}`}
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </>
      )}
    </div>
  );
}
