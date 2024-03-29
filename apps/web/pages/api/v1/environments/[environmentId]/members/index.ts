import { getSessionUser } from "@/app/lib/api/apiHelper";
import { prisma } from "@formbricks/database";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Check Authentication
  const user: any = await getSessionUser(req, res);
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const environmentId = req.query.environmentId?.toString();
  if (environmentId === undefined) {
    return res.status(400).json({ message: "Missing environmentId" });
  }

  if (req.method === "GET") {
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      include: {
        product: {
          select: {
            teamId: true,
            team: {
              select: {
                memberships: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!environment) {
      return res.status(400).json({ message: "Invalid environment ID" });
    }

    const teamId = environment.product.teamId;

    if (!teamId || environment.product.team.memberships.length === 0) {
      return res.status(403).json({
        message: "You don't have access to this organisation or this organisation doesn't exist",
      });
    }

    const membersData = await prisma.membership.findMany({
      where: { teamId },
      select: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        userId: true,
        accepted: true,
        role: true,
      },
    });
    const members = membersData.map((member) => {
      return {
        name: member.user?.name || "",
        email: member.user?.email || "",
        userId: member.userId,
        accepted: member.accepted,
        role: member.role,
      };
    });

    const inviteeData = await prisma.invite.findMany({
      where: { teamId, accepted: false },
      select: {
        id: true,
        name: true,
        email: true,
        acceptorId: true,
        role: true,
        accepted: true,
        expiresAt: true,
      },
    });
    const invitees = inviteeData.map((invite) => {
      return {
        name: invite.name,
        email: invite.email,
        inviteId: invite.id,
        acceptorId: invite.acceptorId,
        role: invite.role,
        accepted: invite.accepted,
        expiresAt: invite.expiresAt,
      };
    });

    return res.json({ members, invitees, teamId });
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported by this route.`);
  }
}
