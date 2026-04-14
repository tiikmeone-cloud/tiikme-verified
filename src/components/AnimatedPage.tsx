import { ReactNode } from "react";

const AnimatedPage = ({ children }: { children: ReactNode }) => (
  <div className="page-enter">{children}</div>
);

export default AnimatedPage;
