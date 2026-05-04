import { FaCheckCircle, FaCreditCard, FaUser } from "react-icons/fa";

const STEPS = [
  { key: 1, label: "Thong tin", icon: <FaUser /> },
  { key: 2, label: "Thanh toan", icon: <FaCreditCard /> },
  { key: 3, label: "Hoan tat", icon: <FaCheckCircle /> },
];

const ProgressBar = ({ currentStep }) => (
  <div className="commerce-steps">
    {STEPS.map((step) => (
      <div
        key={step.key}
        className={`commerce-step ${currentStep >= step.key ? "active" : ""}`}
      >
        <span className="commerce-step-icon">{step.icon}</span>
        <strong>{step.label}</strong>
      </div>
    ))}
  </div>
);

export default ProgressBar;
