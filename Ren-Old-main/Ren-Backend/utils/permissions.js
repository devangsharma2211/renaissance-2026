// Central RBAC Permission Engine
 
export const ROLE_LEVEL = {
  superadmin: 4,
  admin: 3,
  hod: 2,
  dean: 2,
  cc: 1
};



//Check if creatorRole can create targetRole

export function canCreate(creatorRole, targetRole) {
  if (!ROLE_LEVEL[creatorRole] || !ROLE_LEVEL[targetRole]) return false;

  if (creatorRole === "superadmin") return true;

  if (creatorRole === "admin") {
    return ["hod", "dean", "cc"].includes(targetRole);
  }

  return false;
}

//Check if actorRole can delete targetRole (mirrors creation rules)

export function canDelete(actorRole, targetRole) {
  return canCreate(actorRole, targetRole);
}


//Check if role can view outsider data

export function canAccessOutsiders(role) {
  return ["superadmin", "admin"].includes(role);
}


//Check if role can view all students

export function canViewAllStudents(role) {
  return ["superadmin", "admin"].includes(role);
}
