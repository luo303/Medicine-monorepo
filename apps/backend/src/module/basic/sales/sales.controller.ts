import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
} from './dto/sales-order.dto';
import {
  CreateSalesDetailDto,
  UpdateSalesDetailDto,
} from './dto/sales-detail.dto';
import {
  CreateSalesOutboundDto,
  UpdateSalesOutboundDto,
} from './dto/sales-outbound.dto';
import { Public } from '@/custom/Public';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // 销售订单接口
  @Public()
  @Get('order')
  async findAllOrders() {
    const orders = await this.salesService.findAllOrders();
    return {
      data: orders,
      message: '获取销售订单列表成功',
    };
  }

  @Public()
  @Get('order/:order_no')
  async findOneOrder(@Param('order_no') order_no: string) {
    const order = await this.salesService.findOneOrder(order_no);
    return {
      data: order,
      message: order ? '获取销售订单详情成功' : '未找到该订单',
    };
  }

  @Post('order')
  async createOrder(@Body() createDto: CreateSalesOrderDto) {
    const order = await this.salesService.createOrder(createDto);
    return {
      data: order,
      message: '创建销售订单成功',
    };
  }

  @Put('order/:order_no')
  async updateOrder(
    @Param('order_no') order_no: string,
    @Body() updateDto: UpdateSalesOrderDto,
  ) {
    const order = await this.salesService.updateOrder(order_no, updateDto);
    return {
      data: order,
      message: '修改销售订单成功',
    };
  }

  @Delete('order/:order_no')
  async removeOrder(@Param('order_no') order_no: string) {
    const result = await this.salesService.removeOrder(order_no);
    return {
      message: result ? '删除销售订单成功' : '未找到该订单，删除失败',
    };
  }

  // 销售明细接口
  @Public()
  @Get('detail')
  async findAllDetails() {
    const details = await this.salesService.findAllDetails();
    return {
      data: details,
      message: '获取销售明细列表成功',
    };
  }

  @Public()
  @Get('detail/:id')
  async findOneDetail(@Param('id') id: string) {
    const detail = await this.salesService.findOneDetail(+id);
    return {
      data: detail,
      message: detail ? '获取销售明细详情成功' : '未找到该明细',
    };
  }

  @Post('detail')
  async createDetail(@Body() createDto: CreateSalesDetailDto) {
    const detail = await this.salesService.createDetail(createDto);
    return {
      data: detail,
      message: '创建销售明细成功',
    };
  }

  @Put('detail/:id')
  async updateDetail(
    @Param('id') id: string,
    @Body() updateDto: UpdateSalesDetailDto,
  ) {
    const detail = await this.salesService.updateDetail(+id, updateDto);
    return {
      data: detail,
      message: '修改销售明细成功',
    };
  }

  @Delete('detail/:id')
  async removeDetail(@Param('id') id: string) {
    const result = await this.salesService.removeDetail(+id);
    return {
      message: result ? '删除销售明细成功' : '未找到该明细，删除失败',
    };
  }

  // 销售出库接口
  @Public()
  @Get('outbound')
  async findAllOutbounds() {
    const outbounds = await this.salesService.findAllOutbounds();
    return {
      data: outbounds,
      message: '获取销售出库列表成功',
    };
  }

  @Public()
  @Get('outbound/:id')
  async findOneOutbound(@Param('id') id: string) {
    const outbound = await this.salesService.findOneOutbound(+id);
    return {
      data: outbound,
      message: outbound ? '获取销售出库详情成功' : '未找到该出库记录',
    };
  }

  @Post('outbound')
  async createOutbound(@Body() createDto: CreateSalesOutboundDto) {
    const outbound = await this.salesService.createOutbound(createDto);
    return {
      data: outbound,
      message: '创建销售出库记录成功',
    };
  }

  @Put('outbound/:id')
  async updateOutbound(
    @Param('id') id: string,
    @Body() updateDto: UpdateSalesOutboundDto,
  ) {
    const outbound = await this.salesService.updateOutbound(+id, updateDto);
    return {
      data: outbound,
      message: '修改销售出库记录成功',
    };
  }

  @Delete('outbound/:id')
  async removeOutbound(@Param('id') id: string) {
    const result = await this.salesService.removeOutbound(+id);
    return {
      message: result ? '删除销售出库记录成功' : '未找到该出库记录，删除失败',
    };
  }
}
