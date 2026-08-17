import { AuthForm } from "../components/AuthForm";
import { PrivacyDisclosure } from "../components/PrivacyDisclosure";

export default function CareerSignupPage() {
  return <><PrivacyDisclosure /><AuthForm mode="signup" /></>;
}
