import { ChevronsDown } from "lucide-react";

const ScrollDownIndicator = () => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer">
      <p className="text-white text-sm">Scroll Down</p>
      <ChevronsDown size={32} className="text-white animate-bounce" />
    </div>
  );
};

export default ScrollDownIndicator;
