import SetupDivisionStep from './steps/SetupDivisionStep.jsx';
import SetupClubStep from './steps/SetupClubStep.jsx';
import SetupCareerStep from './steps/SetupCareerStep.jsx';
import SetupManagerStep from './steps/SetupManagerStep.jsx';
import SetupKitStep from './steps/SetupKitStep.jsx';
import SetupContractStep from './steps/SetupContractStep.jsx';

const STEP_COMPONENTS = { 1: SetupDivisionStep, 2: SetupClubStep, 3: SetupCareerStep, 4: SetupManagerStep, 5: SetupKitStep, 6: SetupContractStep };

const SetupSteps = ({ card, ...stepProps }) => {
  const StepComponent = STEP_COMPONENTS[card];
  return StepComponent ? <StepComponent {...stepProps} /> : null;
};

export default SetupSteps;
