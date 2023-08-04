import React from "react";
// @ts-expect-error
import Otter from "./otter.png?w=128&h=128&webp";
import { useConfig } from "./useConfig";

const Logo: React.FC = () => {
  const config = useConfig();
  let logo;
  if (config?.customLogo) {
    logo = config.customLogo;
  } else {
    logo = Otter;
  }

  let headerName = "Otterscan";
  if (config?.customHeaderName) {
    headerName = config.customHeaderName;
  }

  return (
    <div className="flex cursor-default items-center justify-center space-x-4 font-title text-6xl font-bold text-link-blue">
      <img
        className="rounded-full"
        src={logo}
        width={96}
        height={96}
        alt="An otter scanning"
        title="An otter scanning"
      />
      <span>{headerName}</span>
    </div>
  );
};

export default React.memo(Logo);
