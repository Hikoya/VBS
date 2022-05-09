import { prisma } from '@constants/db';
import { getSession } from "next-auth/react";

export const getAllLocation = async () => {
    const { data: session} = await getSession();

    if (session) {
        const locations = await prisma.location.findMany();  
        if (location != null) {
            return {"status": true, "error": null, "msg": locations};
        } else {
            return {"status": true, "error": null, "msg": ""};
        }
    } else {
        return {"status": false, "error": "user must be authenticated", "msg": ""};
    }
}