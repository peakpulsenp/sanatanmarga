import { useState, useEffect } from "react";

interface LogoImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export default function LogoImage({
  src = "/logo.svg",
  alt = "Sanatan Marga",
  className = "w-full h-full object-contain",
  fallbackClassName = "w-full h-full bg-primary/10 rounded-lg flex items-center justify-center p-1 text-primary"
}: LogoImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src && src.trim() !== "" ? src : "/logo.svg");

  // Reset error state when src changes
  useEffect(() => {
    const valid = src && src.trim() !== "" ? src : "/logo.svg";
    setImgSrc(valid);
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div className={fallbackClassName} title={alt}>
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary" fill="currentColor">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.4" />
          <path d="M50,15 C60,35 60,50 50,75 C40,50 40,35 50,15 Z" fill="currentColor" />
          <path d="M40,30 C15,45 20,70 45,72 C25,55 30,38 40,30 Z" fill="currentColor" opacity="0.8" />
          <path d="M60,30 C85,45 80,70 55,72 C75,55 70,38 60,30 Z" fill="currentColor" opacity="0.8" />
          <circle cx="50" cy="55" r="8" fill="#F8F4E8" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        if (imgSrc !== "/logo.svg") {
          setImgSrc("/logo.svg");
        } else {
          setHasError(true);
        }
      }}
    />
  );
}
