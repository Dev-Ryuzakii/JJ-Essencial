import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateProfileWithAvatarDto, ProfileResponseDto, UserAddressDto, UpdateUserAddressDto, UserAddressResponseDto } from './dto/profile.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  constructor(private readonly uploadService: UploadService) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone,
      avatar: profile.avatar,
      dateOfBirth: profile.dateOfBirth,
      role: profile.role,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileWithAvatarDto, avatar?: Express.Multer.File): Promise<ProfileResponseDto> {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('Profile not found');
    }

    let avatarUrl = existingProfile.avatar;

    // Upload new avatar if provided
    if (avatar) {
      const uploadResult = await this.uploadService.uploadToSupabase(avatar, 'avatars/images');
      avatarUrl = uploadResult.url;
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        fullName: updateProfileDto.fullName,
        phone: updateProfileDto.phone,
        avatar: avatarUrl,
        dateOfBirth: updateProfileDto.dateOfBirth ? new Date(updateProfileDto.dateOfBirth) : undefined,
      },
    });

    return {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.fullName,
      phone: updatedProfile.phone,
      avatar: updatedProfile.avatar,
      dateOfBirth: updatedProfile.dateOfBirth,
      role: updatedProfile.role,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    };
  }

  async getUserAddresses(userId: string): Promise<UserAddressResponseDto[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return addresses.map(address => ({
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
    }));
  }

  async createUserAddress(userId: string, addressDto: UserAddressDto): Promise<UserAddressResponseDto> {
    // If this is being set as default, unset other defaults
    if (addressDto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await this.prisma.userAddress.create({
      data: {
        userId,
        type: addressDto.type,
        firstName: addressDto.firstName,
        lastName: addressDto.lastName,
        company: addressDto.company,
        address1: addressDto.address1,
        address2: addressDto.address2,
        city: addressDto.city,
        state: addressDto.state,
        postalCode: addressDto.postalCode,
        country: addressDto.country,
        phone: addressDto.phone,
        isDefault: addressDto.isDefault || false,
      },
    });

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
    const existingAddress = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
        isActive: true,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // If this is being set as default, unset other defaults
    if (updateDto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: addressId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedAddress = await this.prisma.userAddress.update({
      where: { id: addressId },
      data: {
        type: updateDto.type,
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        company: updateDto.company,
        address1: updateDto.address1,
        address2: updateDto.address2,
        city: updateDto.city,
        state: updateDto.state,
        postalCode: updateDto.postalCode,
        country: updateDto.country,
        phone: updateDto.phone,
        isDefault: updateDto.isDefault || false,
      },
    });

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
    const existingAddress = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
        isActive: true,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.userAddress.update({
      where: { id: addressId },
      data: { isActive: false },
    });
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<UserAddressResponseDto> {
    const existingAddress = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
        isActive: true,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // Unset other defaults
    await this.prisma.userAddress.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set new default
    const updatedAddress = await this.prisma.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

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

  async getProfileStats(userId: string): Promise<any> {
    const [ordersCount, totalSpent, pendingOrders] = await Promise.all([
      this.prisma.orders.count({
        where: { userId },
      }),
      this.prisma.orders.aggregate({
        where: {
          userId,
          status: { in: ['PAID', 'COMPLETED'] },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.orders.count({
        where: {
          userId,
          status: 'PENDING',
        },
      }),
    ]);

    return {
      totalOrders: ordersCount,
      totalSpent: totalSpent._sum.totalAmount || 0,
      pendingOrders,
    };
  }
}
