const AnimatedBackground = () => {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-griot-gradient opacity-90 motion-grid" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-300/10 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
