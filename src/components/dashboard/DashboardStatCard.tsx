import React from "react";

interface DashboardStatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    description?: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
    title,
    value,
    icon,
    color = "#2563eb",
    description,
}) => {
    return (
        <div
            style={{
                background: "linear-gradient(135deg, #f8fafc 60%, #e0e7ef 100%)",
                borderRadius: 16,
                boxShadow: "0 2px 12px 0 rgba(0,0,0,0.06)",
                padding: 24,
                minWidth: 200,
                minHeight: 140,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div style={{ fontSize: 32, color, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 28, color: "#222", marginBottom: 4 }}>{value}</div>
            <div style={{ fontWeight: 500, fontSize: 15, color: "#444", marginBottom: 2 }}>{title}</div>
            {description && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{description}</div>}
        </div>
    );
};

export default DashboardStatCard;
