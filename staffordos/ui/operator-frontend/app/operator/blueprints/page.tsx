import BlueprintOnboardingWorkspace from "./BlueprintOnboardingWorkspace";

export default function BlueprintOnboardingPage() {
  return (
    <main className="blueprintWorkspacePage">
      <div className="blueprintWorkspaceHeading">
        <p className="operatorShellHeaderLabel">Stafford Media / Paid engagements</p>
        <h1>Blueprint onboarding</h1>
        <p>Review verified purchases and move one engagement through the approved onboarding gates. Website inquiries and outbound prospects remain separate.</p>
      </div>
      <BlueprintOnboardingWorkspace />
    </main>
  );
}
