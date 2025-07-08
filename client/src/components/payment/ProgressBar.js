import {FaUser, FaCreditCard, FaCheckCircle} from "react-icons/fa";
const ProgressBar = ({currentStep} ) => {
    return (
      <div className="d-flex justify-content-center mb-5">
        <div className="position-relative w-75">
          <div className="progress" style={{ height: "2px" }}>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${(currentStep - 1) * 50}%` }}
              aria-valuenow={(currentStep - 1) * 50}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <div className="position-absolute top-0 start-0 translate-middle">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center ${
                currentStep >= 1 ? "bg-success" : "bg-secondary"
              }`}
              style={{ width: "40px", height: "40px" }}
            >
              <FaUser className="text-white" />
            </div>
            <div className="mt-2 text-center">
              <small>Thông tin</small>
            </div>
          </div>
          <div className="position-absolute top-0 start-50 translate-middle">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center ${
                currentStep >= 2 ? "bg-success" : "bg-secondary"
              }`}
              style={{ width: "40px", height: "40px" }}
            >
              <FaCreditCard className="text-white" />
            </div>
            <div className="mt-2 text-center">
              <small>Thanh toán</small>
            </div>
          </div>
          <div className="position-absolute top-0 end-0 translate-middle">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center ${
                currentStep >= 3 ? "bg-success" : "bg-secondary"
              }`}
              style={{ width: "40px", height: "40px" }}
            >
              <FaCheckCircle className="text-white" />
            </div>
            <div className="mt-2 text-center">
              <small>Hoàn tất</small>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default ProgressBar;