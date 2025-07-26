import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Community, Tenant, MaintenanceRecord, Payment, Subscription, User, Block, Flat, SubscriptionPayment, PlatformSettings } from '../types';

// FIXED: Added proper type definition for community settings instead of 'any'
interface CommunitySettings {
  paymentGateway: {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    webhookSecret: string;
  };
  whatsapp: {
    wabaNumber: string;
    apiKey: string;
    baseUrl: string;
  };
  charges: {
    gstEnabled: boolean;
    gstPercentage: number;
    handlingCharges: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    reminderDays: number[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Platform Settings Service
export const platformSettingsService = {
  async getPlatformSettings(): Promise<PlatformSettings | null> {
    try {
      const docSnap = await getDoc(doc(db, 'platformSettings', 'main'));
      if (docSnap.exists()) {
        return docSnap.data() as PlatformSettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      return null;
    }
  },

  async updatePlatformSettings(settings: Partial<PlatformSettings>) {
    try {
      await setDoc(doc(db, 'platformSettings', 'main'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating platform settings:', error);
      throw error;
    }
  },

  async createInitialPlatformSettings() {
    try {
      const initialSettings: PlatformSettings = {
        razorpayKeyId: '',
        razorpayKeySecret: '',
        commissionPercentage: 2.5,
        gstOnCommission: true,
        platformName: 'SocietyPay',
        supportEmail: 'support@societypay.com',
        supportPhone: '+91 98765 43210'
      };
      
      await setDoc(doc(db, 'platformSettings', 'main'), {
        ...initialSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return initialSettings;
    } catch (error) {
      console.error('Error creating initial platform settings:', error);
      throw error;
    }
  }
};

// Community Settings Service
export const communitySettingsService = {
  async getCommunitySettings(communityId: string): Promise<CommunitySettings | null> {
    if (!communityId) throw new Error('Community ID is required');
    try {
      const docSnap = await getDoc(doc(db, 'communitySettings', communityId));
      if (docSnap.exists()) {
        return docSnap.data() as CommunitySettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching community settings:', error);
      return null;
    }
  },

  // FIXED: Replaced 'any' with proper type
  async updateCommunitySettings(communityId: string, settings: Partial<CommunitySettings>) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      await setDoc(doc(db, 'communitySettings', communityId), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating community settings:', error);
      throw error;
    }
  },

  async createInitialCommunitySettings(communityId: string): Promise<CommunitySettings> {
    if (!communityId) throw new Error('Community ID is required');
    try {
      const initialSettings: CommunitySettings = {
        paymentGateway: {
          razorpayKeyId: '',
          razorpayKeySecret: '',
          webhookSecret: ''
        },
        whatsapp: {
          wabaNumber: '',
          apiKey: '',
          baseUrl: 'https://cpaasreseller.notify24x7.com/REST/directApi'
        },
        charges: {
          gstEnabled: true,
          gstPercentage: 18,
          handlingCharges: 50
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          whatsappEnabled: true,
          reminderDays: [3, 1]
        }
      };
      
      await setDoc(doc(db, 'communitySettings', communityId), {
        ...initialSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return initialSettings;
    } catch (error) {
      console.error('Error creating initial community settings:', error);
      throw error;
    }
  }
};

// Community Services
export const communityService = {
  async createCommunity(communityData: Omit<Community, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'communities'), {
        ...communityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  },

  async getCommunities(limitCount?: number) {  // Added optional limit
    try {
      let q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'));
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
        updatedAt: doc.data().updatedAt?.toDate() ?? null,
        subscriptionStartDate: doc.data().subscriptionStartDate?.toDate() ?? null,
        subscriptionEndDate: doc.data().subscriptionEndDate?.toDate() ?? null,
      } as Community));
    } catch (error) {
      console.error('Error fetching communities:', error);
      throw error;
    }
  },

  async getCommunity(id: string) {
    if (!id) throw new Error('Community ID is required');
    try {
      const docSnap = await getDoc(doc(db, 'communities', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() ?? null,
          updatedAt: data.updatedAt?.toDate() ?? null,
          subscriptionStartDate: data.subscriptionStartDate?.toDate() ?? null,
          subscriptionEndDate: data.subscriptionEndDate?.toDate() ?? null,
        } as Community;
      }
      return null;
    } catch (error) {
      console.error('Error fetching community:', error);
      throw error;
    }
  },

  async updateCommunity(id: string, updates: Partial<Community>) {
    if (!id) throw new Error('Community ID is required');
    try {
      await updateDoc(doc(db, 'communities', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  },

  async deleteCommunity(id: string) {
    if (!id) throw new Error('Community ID is required');
    try {
      await deleteDoc(doc(db, 'communities', id));
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  },

  async toggleCommunityStatus(id: string) {
    if (!id) throw new Error('Community ID is required');
    try {
      const communityDoc = await getDoc(doc(db, 'communities', id));
      if (communityDoc.exists()) {
        const currentStatus = communityDoc.data().isActive;
        await updateDoc(doc(db, 'communities', id), {
          isActive: !currentStatus,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error toggling community status:', error);
      throw error;
    }
  },

  async updateSubscription(communityId: string, subscriptionId: string, startDate: Date, endDate: Date) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      await updateDoc(doc(db, 'communities', communityId), {
        subscriptionId,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        isActive: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }
};

// User Services
export const userService = {
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async createUserWithId(userId: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('User ID is required');
    try {
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return userId;
    } catch (error) {
      console.error('Error creating user with ID:', error);
      throw error;
    }
  },

  async getUsers(limitCount?: number) {  // Added optional limit
    try {
      let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
        updatedAt: doc.data().updatedAt?.toDate() ?? null,
      } as User));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUser(id: string) {
    if (!id) throw new Error('User ID is required');
    try {
      const docSnap = await getDoc(doc(db, 'users', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() ?? null,
          updatedAt: data.updatedAt?.toDate() ?? null,
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async getUsersByCommunity(communityId: string, limitCount?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      let q = query(collection(db, 'users'), where('communityId', '==', communityId), orderBy('createdAt', 'desc'));
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
        updatedAt: doc.data().updatedAt?.toDate() ?? null,
      } as User));
    } catch (error) {
      console.error('Error fetching users by community:', error);
      throw error;
    }
  },

  async updateUser(id: string, updates: Partial<User>) {
    if (!id) throw new Error('User ID is required');
    try {
      await updateDoc(doc(db, 'users', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
};

// Block Services
export const blockService = {
  async createBlock(blockData: Omit<Block, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'blocks'), {
        ...blockData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating block:', error);
      throw error;
    }
  },

  async getBlocks(communityId: string, limitCount?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      let q = query(
        collection(db, 'blocks'), 
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as Block));
    } catch (error) {
      console.error('Error fetching blocks:', error);
      throw error;
    }
  },

  async updateBlock(id: string, updates: Partial<Block>) {
    if (!id) throw new Error('Block ID is required');
    try {
      await updateDoc(doc(db, 'blocks', id), {
        ...updates,
        updatedAt: serverTimestamp(),  // Added for consistency
      });
    } catch (error) {
      console.error('Error updating block:', error);
      throw error;
    }
  },

  async deleteBlock(id: string) {
    if (!id) throw new Error('Block ID is required');
    try {
      await deleteDoc(doc(db, 'blocks', id));
    } catch (error) {
      console.error('Error deleting block:', error);
      throw error;
    }
  }
};

// Flat Services
export const flatService = {
  async createFlat(flatData: Omit<Flat, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'flats'), {
        ...flatData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating flat:', error);
      throw error;
    }
  },

  async getFlats(communityId: string, limitCount?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      let q = query(
        collection(db, 'flats'), 
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as Flat));
    } catch (error) {
      console.error('Error fetching flats:', error);
      throw error;
    }
  },

  async getFlatsByBlock(blockId: string, limitCount?: number) {
    if (!blockId) throw new Error('Block ID is required');
    try {
      let q = query(
        collection(db, 'flats'), 
        where('blockId', '==', blockId),
        orderBy('createdAt', 'desc')
      );
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as Flat));
    } catch (error) {
      console.error('Error fetching flats by block:', error);
      throw error;
    }
  },

  async updateFlat(id: string, updates: Partial<Flat>) {
    if (!id) throw new Error('Flat ID is required');
    try {
      await updateDoc(doc(db, 'flats', id), {
        ...updates,
        updatedAt: serverTimestamp(),  // Added for consistency
      });
    } catch (error) {
      console.error('Error updating flat:', error);
      throw error;
    }
  },

  async deleteFlat(id: string) {
    if (!id) throw new Error('Flat ID is required');
    try {
      await deleteDoc(doc(db, 'flats', id));
    } catch (error) {
      console.error('Error deleting flat:', error);
      throw error;
    }
  }
};

// Tenant Services
export const tenantService = {
  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'tenants'), {
        ...tenantData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  },

  async getTenants(communityId: string, limitCount?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      let q = query(
        collection(db, 'tenants'), 
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as Tenant));
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
  },

  async updateTenant(id: string, updates: Partial<Tenant>) {
    if (!id) throw new Error('Tenant ID is required');
    try {
      await updateDoc(doc(db, 'tenants', id), {
        ...updates,
        updatedAt: serverTimestamp(),  // Added for consistency
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  },

  async deleteTenant(id: string) {
    if (!id) throw new Error('Tenant ID is required');
    try {
      await deleteDoc(doc(db, 'tenants', id));
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  },

  async getTenantStats(communityId: string) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      const tenants = await this.getTenants(communityId);
      const activeTenants = tenants.filter(t => t.isActive);
      const totalMonthlyMaintenance = activeTenants.reduce((sum, t) => sum + (t.monthlyMaintenance ?? 0), 0);
      
      return {
        totalTenants: activeTenants.length,
        totalMonthlyMaintenance,
      };
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      throw error;
    }
  }
};

// Maintenance Services
export const maintenanceService = {
  async createMaintenanceRecord(recordData: Omit<MaintenanceRecord, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'maintenanceRecords'), {
        ...recordData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  },

  async getMaintenanceRecords(communityId: string, filters?: Partial<{ 
    status: string; 
    month: string; 
    year: number;
    tenantId: string;
  }>, limitCount?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      let q = query(
        collection(db, 'maintenanceRecords'), 
        where('communityId', '==', communityId)
      );
      
      if (filters?.status) q = query(q, where('status', '==', filters.status));
      if (filters?.month) q = query(q, where('month', '==', filters.month));
      if (filters?.year) q = query(q, where('year', '==', filters.year));
      if (filters?.tenantId) q = query(q, where('tenantId', '==', filters.tenantId));
      
      q = query(q, orderBy('createdAt', 'desc'));
      if (limitCount) q = query(q, limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() ?? null,
        paidDate: doc.data().paidDate?.toDate() ?? null,
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as MaintenanceRecord));
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
  },

  async updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>) {
    if (!id) throw new Error('Maintenance Record ID is required');
    try {
      await updateDoc(doc(db, 'maintenanceRecords', id), {
        ...updates,
        updatedAt: serverTimestamp(),  // Added for consistency
      });
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  },

  async generateMonthlyMaintenance(communityId: string, month: string, year: number) {
    if (!communityId || !month || !year) throw new Error('Required parameters missing');
    try {
      const tenants = await tenantService.getTenants(communityId);
      const community = await communityService.getCommunity(communityId);
      
      if (!community) throw new Error('Community not found');
      if (!community.settings?.charges) throw new Error('Community settings incomplete');

      const batch = writeBatch(db);
      const records: (MaintenanceRecord & { id: string })[] = [];
      
      // Robust dueDate calculation
      const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
      if (isNaN(monthIndex)) throw new Error('Invalid month string');

      for (const tenant of tenants.filter(t => t.isActive)) {
        const gstAmount = community.settings.charges.gstEnabled 
          ? (tenant.monthlyMaintenance * community.settings.charges.gstPercentage) / 100 
          : 0;
        
        const totalAmount = tenant.monthlyMaintenance + gstAmount + community.settings.charges.handlingCharges;
        
        const recordData = {
          communityId,
          tenantId: tenant.id,
          month,
          year,
          amount: tenant.monthlyMaintenance,
          gstAmount,
          handlingCharges: community.settings.charges.handlingCharges,
          totalAmount,
          status: 'pending' as const,
          dueDate: new Date(year, monthIndex, 10),
          createdAt: serverTimestamp(),
        };
        
        const docRef = doc(collection(db, 'maintenanceRecords'));
        batch.set(docRef, recordData);
        records.push({ id: docRef.id, ...recordData } as MaintenanceRecord & { id: string });
      }
      
      // Check batch size (Firestore limit: 500)
      if (records.length > 500) throw new Error('Too many records for a single batch');
      
      await batch.commit();
      return records;
    } catch (error) {
      console.error('Error generating monthly maintenance:', error);
      throw error;
    }
  },

  async getMaintenanceStats(communityId: string, month?: string, year?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      const currentMonth = month || new Date().toLocaleString('default', { month: 'long' });
      const currentYear = year || new Date().getFullYear();
      
      const records = await this.getMaintenanceRecords(communityId, { 
        month: currentMonth, 
        year: currentYear 
      });
      
      const totalPaid = records
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);
      
      const totalDue = records
        .filter(r => r.status === 'pending' || r.status === 'overdue')
        .reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);
      
      const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);
      const collectionRate = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
      
      return {
        totalPaid,
        totalDue,
        totalAmount,
        collectionRate,
        recordsCount: records.length,
      };
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      throw error;
    }
  }
};

// Payment Services
export const paymentService = {
  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  async getPayments(communityId: string, limitCount?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      let q = query(
        collection(db, 'payments'), 
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as Payment));
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  async updatePayment(id: string, updates: Partial<Payment>) {
    if (!id) throw new Error('Payment ID is required');
    try {
      await updateDoc(doc(db, 'payments', id), {
        ...updates,
        updatedAt: serverTimestamp(),  // Added for consistency
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }
};

// Subscription Services
export const subscriptionService = {
  async createSubscription(subscriptionData: Omit<Subscription, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'subscriptions'), {
        ...subscriptionData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  async getSubscriptions(limitCount?: number) {
    try {
      let q = query(collection(db, 'subscriptions'), orderBy('price', 'asc'));
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as Subscription));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  },

  async getActiveSubscriptions(limitCount?: number) {
    try {
      let q = query(
        collection(db, 'subscriptions'), 
        where('isActive', '==', true),
        orderBy('price', 'asc')
      );
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as Subscription));
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
      throw error;
    }
  },

  async updateSubscription(id: string, updates: Partial<Subscription>) {
    if (!id) throw new Error('Subscription ID is required');
    try {
      await updateDoc(doc(db, 'subscriptions', id), {
        ...updates,
        updatedAt: serverTimestamp(),  // Added for consistency
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  async deleteSubscription(id: string) {
    if (!id) throw new Error('Subscription ID is required');
    try {
      await deleteDoc(doc(db, 'subscriptions', id));
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }
};

// Subscription Payment Services
export const subscriptionPaymentService = {
  async createSubscriptionPayment(paymentData: Omit<SubscriptionPayment, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'subscriptionPayments'), {
        ...paymentData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating subscription payment:', error);
      throw error;
    }
  },

  async getSubscriptionPayments(communityId: string, limitCount?: number) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      let q = query(
        collection(db, 'subscriptionPayments'), 
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      if (limitCount) q = query(q, limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() ?? null,
        endDate: doc.data().endDate?.toDate() ?? null,
        createdAt: doc.data().createdAt?.toDate() ?? null,
      } as SubscriptionPayment));
    } catch (error) {
      console.error('Error fetching subscription payments:', error);
      throw error;
    }
  },

  async updateSubscriptionPayment(id: string, updates: Partial<SubscriptionPayment>) {
    if (!id) throw new Error('Subscription Payment ID is required');
    try {
      await updateDoc(doc(db, 'subscriptionPayments', id), {
        ...updates,
        updatedAt: serverTimestamp(),  // Added for consistency
      });
    } catch (error) {
      console.error('Error updating subscription payment:', error);
      throw error;
    }
  }
};

// Dashboard Services
export const dashboardService = {
  async getSuperAdminStats() {
    try {
      const [communities, subscriptions] = await Promise.all([
        communityService.getCommunities(),
        subscriptionService.getSubscriptions()
      ]);
      
      const totalCommunities = communities.length;
      const activeCommunities = communities.filter(c => c.isActive).length;
      const totalTenants = communities.reduce((sum, c) => sum + (c.totalTenants ?? 0), 0);
      
      // Safer monthlyRevenue calculation (average price if multiple subscriptions)
      const avgPrice = subscriptions.length > 0 
        ? subscriptions.reduce((sum, s) => sum + (s.price ?? 0), 0) / subscriptions.length 
        : 0;
      const monthlyRevenue = activeCommunities * avgPrice;
      
      // TODO: Calculate collectionRate dynamically if possible
      const collectionRate = 94.5;  // Placeholder; replace with real calculation
      
      return {
        totalCommunities,
        activeCommunities,
        totalTenants,
        monthlyRevenue,
        collectionRate,
      };
    } catch (error) {
      console.error('Error fetching super admin stats:', error);
      throw error;
    }
  },

  async getCommunityAdminStats(communityId: string) {
    if (!communityId) throw new Error('Community ID is required');
    try {
      const [tenantStats, maintenanceStats] = await Promise.all([
        tenantService.getTenantStats(communityId),
        maintenanceService.getMaintenanceStats(communityId)
      ]);
      
      return {
        ...tenantStats,
        ...maintenanceStats,
      };
    } catch (error) {
      console.error('Error fetching community admin stats:', error);
      throw error;
    }
  }
};
