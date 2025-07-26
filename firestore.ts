rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ────────────── Utility Functions ──────────────
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isSuperAdmin() {
      return isAuthenticated() && getUserData().role == 'super_admin';
    }

    function isCommunityAdmin() {
      return isAuthenticated() && getUserData().role == 'community_admin';
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function belongsToUserCommunity(communityId) {
      return isAuthenticated() && getUserData().communityId == communityId;
    }

    // ────────────── Collection Rules ──────────────

    // Users
    match /users/{userId} {
      allow read: if isOwner(userId) || isSuperAdmin();
      allow write, create: if isOwner(userId);
    }

    // Subscriptions
    match /subscriptions/{subscriptionId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }

    // Super Admin Settings
    match /settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }

    // ✅ Shared Platform Settings (PascalCase) — FIXED!
    match /platformSettings/{docId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }

    // Community Settings
    match /communitySettings/{settingId} {
      allow read, write: if isAuthenticated() &&
        (isSuperAdmin() ||
         (isCommunityAdmin() && resource.data.communityId == getUserData().communityId));
    }

    // Blocks
    match /blocks/{blockId} {
      allow read: if isAuthenticated() &&
        (isSuperAdmin() || belongsToUserCommunity(resource.data.communityId));
      allow write: if isAuthenticated() &&
        (isSuperAdmin() || 
         (isCommunityAdmin() && belongsToUserCommunity(resource.data.communityId)));
    }

    // Flats
    match /flats/{flatId} {
      allow read: if isAuthenticated() &&
        (isSuperAdmin() || belongsToUserCommunity(resource.data.communityId));
      allow write: if isAuthenticated() &&
        (isSuperAdmin() || 
         (isCommunityAdmin() && belongsToUserCommunity(resource.data.communityId)));
    }

    // Tenants
    match /tenants/{tenantId} {
      allow read: if isAuthenticated() &&
        (isSuperAdmin() || belongsToUserCommunity(resource.data.communityId));
      allow write: if isAuthenticated() &&
        (isSuperAdmin() || 
         (isCommunityAdmin() && belongsToUserCommunity(resource.data.communityId)));
    }

    // Payments - FIXED: Added create permission and better access control
    match /payments/{paymentId} {
      allow read: if isAuthenticated() &&
        (isSuperAdmin() || belongsToUserCommunity(resource.data.communityId));
      allow write, create: if isAuthenticated() &&
        (isSuperAdmin() || 
         (isCommunityAdmin() && belongsToUserCommunity(request.resource.data.communityId)));
    }

    // WhatsApp Templates
    match /whatsapp_templates/{templateId} {
      allow read: if isAuthenticated() &&
        (isSuperAdmin() || belongsToUserCommunity(resource.data.communityId));
      allow write: if isAuthenticated() &&
        (isSuperAdmin() || 
         (isCommunityAdmin() && belongsToUserCommunity(resource.data.communityId)));
    }

    // Subscription Payments - FIXED: Better permissions for community admins
    match /subscription_payments/{paymentId} {
      allow read: if isAuthenticated() &&
        (isSuperAdmin() || 
         isOwner(resource.data.userId) ||
         (isCommunityAdmin() && belongsToUserCommunity(resource.data.communityId)));
      allow write, create: if isAuthenticated() &&
        (isSuperAdmin() || 
         isOwner(request.resource.data.userId) ||
         (isCommunityAdmin() && belongsToUserCommunity(request.resource.data.communityId)));
    }

    // Communities
    match /communities/{communityId} {
      allow read: if isAuthenticated() &&
        (isSuperAdmin() || belongsToUserCommunity(communityId));
      allow write: if isSuperAdmin();
    }

    // Deny everything else by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}