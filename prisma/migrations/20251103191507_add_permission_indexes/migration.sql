-- CreateIndex
CREATE INDEX IF NOT EXISTS "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_roles_roleId_idx" ON "user_roles"("roleId");

