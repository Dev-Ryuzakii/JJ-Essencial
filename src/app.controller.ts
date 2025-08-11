import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SuccessResponseDto } from './common/dto/common.dto';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth(): SuccessResponseDto<any> {
    const result = this.appService.getHealth();
    return new SuccessResponseDto(result, 'E-commerce API is running');
  }

  @Get('version')
  @ApiOperation({ summary: 'Get API version' })
  @ApiResponse({ status: 200, description: 'API version information' })
  getVersion(): SuccessResponseDto<any> {
    const result = this.appService.getVersion();
    return new SuccessResponseDto(result, 'API version retrieved');
  }
}
