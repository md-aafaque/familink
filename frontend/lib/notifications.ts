export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  readAt?: number;
  data?: string;
};

export function translateNotification(
  notif: Notification,
  t: (key: string) => string
): { title: string; message: string } {
  let title = notif.title;
  let message = notif.message;

  const titleKey =
    notif.type === "access_request_pending"
      ? notif.title.includes("Upgrade")
        ? "notification.access_request_pending.title.upgrade"
        : "notification.access_request_pending.title.join"
      : `notification.${notif.type}.title`;

  const translatedTitle = t(titleKey);
  if (translatedTitle !== titleKey) {
    title = translatedTitle;
  }

  const msgKey = `notification.${notif.type}.message`;
  const translatedMsg = t(msgKey);
  if (translatedMsg !== msgKey) {
    let temp = translatedMsg;

    if (notif.type === "access_request_approved") {
      const match = notif.message.match(/join as a (\w+) has/);
      if (match) temp = temp.replace("{role}", t(`role.${match[1]}`));
    } else if (notif.type === "access_request_rejected") {
      const match = notif.message.match(/join as a (\w+) was/);
      if (match) temp = temp.replace("{role}", t(`role.${match[1]}`));
    } else if (notif.type === "access_request_pending") {
      const upgradeMatch = notif.message.match(/upgrade from (\w+) to (\w+)/);
      if (upgradeMatch) {
        temp = t("notification.access_request_pending.upgrade_message")
          .replace("{currentRole}", t(`role.${upgradeMatch[1]}`))
          .replace("{requestedRole}", t(`role.${upgradeMatch[2]}`));
      } else {
        const joinMatch = notif.message.match(/join your family tree as a (\w+)/);
        if (joinMatch)
          temp = t("notification.access_request_pending.join_message").replace(
            "{role}",
            t(`role.${joinMatch[1]}`)
          );
      }
    } else if (notif.type === "deletion_proposal_pending") {
      const match = notif.message.match(/proposed for (.*)/);
      if (match) temp = temp.replace("{name}", match[1]);
    } else if (notif.type === "claim_request_pending") {
      const match = notif.message.match(/claim the profile of (.*)/);
      if (match) temp = temp.replace("{name}", match[1]);
    } else if (notif.type === "merge_proposal_pending") {
      const match = notif.message.match(/proposed for (.*) into (.*)/);
      if (match)
        temp = temp.replace("{source}", match[1]).replace("{target}", match[2]);
    } else if (notif.type === "permission_granted") {
      const match = notif.message.match(/granted (\w+) rights/);
      if (match) temp = temp.replace("{permissionType}", match[1]);
    } else if (notif.type === "relationship_pending") {
      const match = notif.message.match(/A new (\w+) relationship/);
      if (match)
        temp = temp.replace("{relationshipType}", t(`relationship.${match[1]}`));
    } else if (notif.type === "relationship_approved") {
      const match = notif.message.match(/Your proposed (\w+) relationship/);
      if (match)
        temp = temp.replace("{relationshipType}", t(`relationship.${match[1]}`));
    } else if (notif.type === "relationship_rejected") {
      const match = notif.message.match(
        /Your proposed (\w+) relationship was rejected: (.*)/
      );
      if (match)
        temp = temp
          .replace("{relationshipType}", t(`relationship.${match[1]}`))
          .replace("{reason}", match[2]);
    }

    message = temp;
  }

  return { title, message };
}
