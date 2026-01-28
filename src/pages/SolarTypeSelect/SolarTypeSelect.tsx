import { ImageCard } from "../../components/ui/ImageCard";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./SolarTypeSelect.css";


export default function SolarTypeSelect() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="solar-type-select">
      <h2 className="solar-type-select__title">
        {t("title.whereInstall")}
      </h2>

      <div className="solar-type-select__options">
        <ImageCard
          title={t("solarTypes.ground")}
          image="/images/poline.jpg"
          onClick={() => navigate("/ground")}
        />

        <ImageCard
          title={t("solarTypes.roof")}
          image="/images/roof.jpg"
          onClick={() => navigate("/roof")}
        />
      </div>
    </div>
  );
}
