import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  ProfileResponseDto,
  UserAddressDto,
  UpdateUserAddressDto,
  UserAddressResponseDto,
} from './dto/profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { SuccessResponseDto } from '../../common/dto/common.dto';

@ApiTags('User Profile')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  async getProfile(@UserId() userId: string): Promise<SuccessResponseDto<ProfileResponseDto>> {
    const profile = await this.usersService.getProfile(userId);
    return new SuccessResponseDto(profile, 'Profile retrieved successfully');
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  async updateProfile(
    @UserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<SuccessResponseDto<ProfileResponseDto>> {
    const profile = await this.usersService.updateProfile(userId, updateProfileDto);
    return new SuccessResponseDto(profile, 'Profile updated successfully');
  }

  @Get('profile/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile statistics' })
  @ApiResponse({ status: 200, description: 'Profile statistics retrieved successfully' })
  async getProfileStats(@UserId() userId: string): Promise<SuccessResponseDto<any>> {
    const stats = await this.usersService.getProfileStats(userId);
    return new SuccessResponseDto(stats, 'Profile statistics retrieved successfully');
  }

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user addresses' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    type: [UserAddressResponseDto],
  })
  async getUserAddresses(@UserId() userId: string): Promise<SuccessResponseDto<UserAddressResponseDto[]>> {
    const addresses = await this.usersService.getUserAddresses(userId);
    return new SuccessResponseDto(addresses, 'Addresses retrieved successfully');
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
    type: UserAddressResponseDto,
  })
  async createAddress(
    @UserId() userId: string,
    @Body() addressDto: UserAddressDto,
  ): Promise<SuccessResponseDto<UserAddressResponseDto>> {
    const address = await this.usersService.createUserAddress(userId, addressDto);
    return new SuccessResponseDto(address, 'Address created successfully');
  }

  @Put('addresses/:addressId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
    type: UserAddressResponseDto,
  })
  async updateAddress(
    @UserId() userId: string,
    @Param('addressId') addressId: string,
    @Body() updateDto: UpdateUserAddressDto,
  ): Promise<SuccessResponseDto<UserAddressResponseDto>> {
    const address = await this.usersService.updateUserAddress(userId, addressId, updateDto);
    return new SuccessResponseDto(address, 'Address updated successfully');
  }

  @Delete('addresses/:addressId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete address' })
  @ApiResponse({ status: 204, description: 'Address deleted successfully' })
  async deleteAddress(
    @UserId() userId: string,
    @Param('addressId') addressId: string,
  ): Promise<void> {
    await this.usersService.deleteUserAddress(userId, addressId);
  }

  @Patch('addresses/:addressId/default')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set address as default' })
  @ApiResponse({
    status: 200,
    description: 'Default address updated successfully',
    type: UserAddressResponseDto,
  })
  async setDefaultAddress(
    @UserId() userId: string,
    @Param('addressId') addressId: string,
  ): Promise<SuccessResponseDto<UserAddressResponseDto>> {
    const address = await this.usersService.setDefaultAddress(userId, addressId);
    return new SuccessResponseDto(address, 'Default address updated successfully');
  }
}
