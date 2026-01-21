import { WizardProvider } from "./WizardProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}
