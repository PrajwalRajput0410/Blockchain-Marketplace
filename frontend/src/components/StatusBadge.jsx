const map = {
  pending: "bg-warning-subtle text-warning-emphasis",
  approved: "bg-success-subtle text-success-emphasis",
  rejected: "bg-danger-subtle text-danger-emphasis",
  unpaid: "bg-secondary-subtle text-secondary-emphasis",
  paid: "bg-info-subtle text-info-emphasis",
  hospital: "bg-primary-subtle text-primary-emphasis",
  laboratory: "bg-success-subtle text-success-emphasis",
  researcher: "bg-info-subtle text-info-emphasis",
  admin: "bg-dark text-white",
};

export default function StatusBadge({ value }) {
  if (!value) return null;
  return (
    <span className={`badge badge-soft ${map[value] || "bg-light text-dark"}`}>
      {value}
    </span>
  );
}
