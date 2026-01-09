import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list() {
    return this.productsService.listProducts();
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto.name, dto.codeType);
  }
}
