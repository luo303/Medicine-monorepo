import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Public } from '@/custom/Public';
import { SalesService } from './sales.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
} from './dto/sales-order.dto';
import {
  CreateSalesDetailDto,
  UpdateSalesDetailDto,
} from './dto/sales-detail.dto';
import { UpdateSalesOutboundDto } from './dto/sales-outbound.dto';
import { SubmitSalesOutboundDto } from './dto/submit-sales-outbound.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Public()
  @Get('order')
  async findAllOrders() {
    return {
      data: await this.salesService.findAllOrders(),
      message: '获取销售订单列表成功',
    };
  }

  @Public()
  @Get('order/:order_no')
  async findOneOrder(@Param('order_no') orderNo: string) {
    return {
      data: await this.salesService.findOneOrder(orderNo),
      message: '获取销售订单详情成功',
    };
  }

  @Post('order')
  async createOrder(@Body() createDto: CreateSalesOrderDto) {
    return {
      data: await this.salesService.createOrder(createDto),
      message: '创建销售订单成功',
    };
  }

  @Put('order/:order_no')
  async updateOrder(
    @Param('order_no') orderNo: string,
    @Body() updateDto: UpdateSalesOrderDto,
  ) {
    return {
      data: await this.salesService.updateOrder(orderNo, updateDto),
      message: '更新销售订单成功',
    };
  }

  @Delete('order/:order_no')
  async removeOrder(@Param('order_no') orderNo: string) {
    await this.salesService.removeOrder(orderNo);
    return {
      message: '删除销售订单成功',
    };
  }

  @Public()
  @Get('detail')
  async findAllDetails() {
    return {
      data: await this.salesService.findAllDetails(),
      message: '获取销售明细列表成功',
    };
  }

  @Public()
  @Get('detail/:id')
  async findOneDetail(@Param('id') id: string) {
    return {
      data: await this.salesService.findOneDetail(+id),
      message: '获取销售明细详情成功',
    };
  }

  @Post('detail')
  async createDetail(@Body() createDto: CreateSalesDetailDto) {
    return {
      data: await this.salesService.createDetail(createDto),
      message: '创建销售明细成功',
    };
  }

  @Put('detail/:id')
  async updateDetail(
    @Param('id') id: string,
    @Body() updateDto: UpdateSalesDetailDto,
  ) {
    return {
      data: await this.salesService.updateDetail(+id, updateDto),
      message: '更新销售明细成功',
    };
  }

  @Delete('detail/:id')
  async removeDetail(@Param('id') id: string) {
    await this.salesService.removeDetail(+id);
    return {
      message: '删除销售明细成功',
    };
  }

  @Public()
  @Get('outbound')
  async findAllOutbounds() {
    return {
      data: await this.salesService.findAllOutbounds(),
      message: '获取销售出库记录列表成功',
    };
  }

  @Public()
  @Get('outbound/:id')
  async findOneOutbound(@Param('id') id: string) {
    return {
      data: await this.salesService.findOneOutbound(+id),
      message: '获取销售出库记录详情成功',
    };
  }

  @Post('outbound')
  async createOutbound(@Body() createDto: SubmitSalesOutboundDto) {
    return {
      data: await this.salesService.createOutbound(createDto),
      message: '提交销售出库成功',
    };
  }

  @Put('outbound/:id')
  async updateOutbound(
    @Param('id') id: string,
    @Body() updateDto: UpdateSalesOutboundDto,
  ) {
    return {
      data: await this.salesService.updateOutbound(+id, updateDto),
      message: '更新销售出库记录成功',
    };
  }

  @Delete('outbound/:id')
  async removeOutbound(@Param('id') id: string) {
    await this.salesService.removeOutbound(+id);
    return {
      message: '删除销售出库记录成功',
    };
  }
}
