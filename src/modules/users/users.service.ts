import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';
import { UpdateProfileWithAvatarDto, ProfileResponseDto, UserAddressDto, UpdateUserAddressDto, UserAddressResponseDto } from './dto/profile.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const { data: profile, error } = await this.supabase
      .from('profile')
      .select('*, user_address!left(*)')
      .eq('id', userId)
      .eq('user_address.is_active', true)
      .order('user_address(is_default)', { ascending: false })
      .single();

    if (error) throw error;
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatar: profile.avatar,
      dateOfBirth: profile.date_of_birth,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileWithAvatarDto, avatar?: Express.Multer.File): Promise<ProfileResponseDto> {
    const { data: existingProfile, error: fetchError } = await this.supabase
      .from('profile')
      .select()
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingProfile) {
      throw new NotFoundException('Profile not found');
    }

    let avatarUrl = existingProfile.avatar;

    // Upload new avatar if provided
    if (avatar) {
      const uploadResult = await this.uploadService.uploadToSupabase(avatar, 'avatars/images');
      avatarUrl = uploadResult.url;
    }

    const { data: updatedProfile, error: updateError } = await this.supabase
      .from('profile')
      .update({
        full_name: updateProfileDto.fullName,
        phone: updateProfileDto.phone,
        avatar: avatarUrl,
        date_of_birth: updateProfileDto.dateOfBirth ? new Date(updateProfileDto.dateOfBirth).toISOString() : null,
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.full_name,
      phone: updatedProfile.phone,
      avatar: updatedProfile.avatar,
      dateOfBirth: updatedProfile.date_of_birth,
      role: updatedProfile.role,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    };
  }

  async getUserAddresses(userId: string): Promise<UserAddressResponseDto[]> {
    const { data: addresses, error } = await this.supabase
      .from('user_address')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return addresses.map(address => ({
      id: address.id,
      userId: address.user_id,
      type: address.type as 'SHIPPING' | 'BILLING' | 'BOTH',
      firstName: address.first_name,
      lastName: address.last_name,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone,
      isDefault: address.is_default,
      isActive: address.is_active,
      createdAt: address.created_at,
      updatedAt: address.updated_at,
    }));
  }

  async createUserAddress(userId: string, addressDto: UserAddressDto): Promise<UserAddressResponseDto> {
    // If this is being set as default, unset other defaults
    if (addressDto.isDefault) {
      const { error: updateError } = await this.supabase
        .from('user_address')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);

      if (updateError) throw updateError;
    }

    const { data: address, error } = await this.supabase
      .from('user_address')
      .insert({
        user_id: userId,
        type: addressDto.type,
        first_name: addressDto.firstName,
        last_name: addressDto.lastName,
        company: addressDto.company,
        address1: addressDto.address1,
        address2: addressDto.address2,
        city: addressDto.city,
        state: addressDto.state,
        postal_code: addressDto.postalCode,
        country: addressDto.country,
        phone: addressDto.phone,
        is_default: addressDto.isDefault || false,
        is_active: true,
      })
      .select()
      .single();

    return {
      id: address.id,
      userId: address.userId,
      type: address.type as 'SHIPPING' | 'BILLING' | 'BOTH',
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault,
      isActive: address.isActive,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  async updateUserAddress(
    userId: string,
    addressId: string,
    updateDto: UpdateUserAddressDto,
  ): Promise<UserAddressResponseDto> {
    const { data: existingAddress, error: fetchError } = await this.supabase
      .from('user_address')
      .select()
      .eq('id', addressId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // If this is being set as default, unset other defaults
    if (updateDto.isDefault) {
      const { error: updateError } = await this.supabase
        .from('user_address')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
        .neq('id', addressId);

      if (updateError) throw updateError;
    }

    const { data: updatedAddress, error: updateError } = await this.supabase
      .from('user_address')
      .update({
        type: updateDto.type,
        first_name: updateDto.firstName,
        last_name: updateDto.lastName,
        company: updateDto.company,
        address1: updateDto.address1,
        address2: updateDto.address2,
        city: updateDto.city,
        state: updateDto.state,
        postal_code: updateDto.postalCode,
        country: updateDto.country,
        phone: updateDto.phone,
        is_default: updateDto.isDefault || false,
      })
      .eq('id', addressId)
      .select()
      .single();

    return {
      id: updatedAddress.id,
      userId: updatedAddress.userId,
      type: updatedAddress.type as 'SHIPPING' | 'BILLING' | 'BOTH',
      firstName: updatedAddress.firstName,
      lastName: updatedAddress.lastName,
      company: updatedAddress.company,
      address1: updatedAddress.address1,
      address2: updatedAddress.address2,
      city: updatedAddress.city,
      state: updatedAddress.state,
      postalCode: updatedAddress.postalCode,
      country: updatedAddress.country,
      phone: updatedAddress.phone,
      isDefault: updatedAddress.isDefault,
      isActive: updatedAddress.isActive,
      createdAt: updatedAddress.createdAt,
      updatedAt: updatedAddress.updatedAt,
    };
  }

  async deleteUserAddress(userId: string, addressId: string): Promise<void> {
    const { data: existingAddress, error: fetchError } = await this.supabase
      .from('user_address')
      .select()
      .eq('id', addressId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingAddress) {
      throw new NotFoundException('Address not found');
    }

    const { error: updateError } = await this.supabase
      .from('user_address')
      .update({ is_active: false })
      .eq('id', addressId);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<UserAddressResponseDto> {
    const { data: existingAddress, error: fetchError } = await this.supabase
      .from('user_address')
      .select()
      .eq('id', addressId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // Unset other defaults
    const { error: updateError1 } = await this.supabase
      .from('user_address')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (updateError1) throw updateError1;

    // Set new default
    const { data: updatedAddress, error: updateError2 } = await this.supabase
      .from('user_address')
      .update({ is_default: true })
      .eq('id', addressId)
      .select()
      .single();

    if (updateError2) throw updateError2;

    return {
      id: updatedAddress.id,
      userId: updatedAddress.user_id,
      type: updatedAddress.type as 'SHIPPING' | 'BILLING' | 'BOTH',
      firstName: updatedAddress.first_name,
      lastName: updatedAddress.last_name,
      company: updatedAddress.company,
      address1: updatedAddress.address1,
      address2: updatedAddress.address2,
      city: updatedAddress.city,
      state: updatedAddress.state,
      postalCode: updatedAddress.postal_code,
      country: updatedAddress.country,
      phone: updatedAddress.phone,
      isDefault: updatedAddress.is_default,
      isActive: updatedAddress.is_active,
      createdAt: updatedAddress.created_at,
      updatedAt: updatedAddress.updated_at,
    };
  }

  async getProfileStats(userId: string): Promise<any> {
    const [
      { count: ordersCount, error: countError },
      { data: completedOrders, error: completedError },
      { count: pendingOrders, error: pendingError },
    ] = await Promise.all([
      this.supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', userId),
      this.supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', userId)
        .in('status', ['PAID', 'COMPLETED']),
      this.supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'PENDING'),
    ]);

    if (countError || completedError || pendingError) {
      throw new Error('Failed to fetch profile stats');
    }

    const totalSpent = completedOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    return {
      totalOrders: ordersCount || 0,
      totalSpent,
      pendingOrders: pendingOrders || 0,
    };
  }
}
