import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ProductoItem } from '../../../modelo/producto';
import { ProductoFormularioDialogo } from './producto-formulario-dialogo';

const PRODUCTO_EXISTENTE: ProductoItem = {
  producto_id: 10,
  nombre: 'Atún Florida 170g',
  marca: 'Florida',
  categoria: 'Conservas',
  proveedor: 'Distribuidora Lima',
  unidad_medida: 'Lata',
  moneda: 'PEN',
  precio_contado: '5.50',
  precio_lista: '6.00',
  forma_venta_credito: 'FIN_DE_MES',
  imagen_url: null,
  estado: 1,
};

describe('ProductoFormularioDialogo', () => {
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/productos`;

  beforeEach(async () => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
      };
    }

    await TestBed.configureTestingModule({
      imports: [ProductoFormularioDialogo],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('rechaza precio_lista menor a precio_contado en validación local', () => {
    const fixture = TestBed.createComponent(ProductoFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirCrear();
    (comp as any).formulario.patchValue({
      nombre: 'Producto Test',
      unidad_medida: 'Unidad',
      moneda: 'PEN',
      precio_contado: '10.00',
      precio_lista: '8.00',
      forma_venta_credito: 'FIN_DE_MES',
    });
    (comp as any).guardar();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('El precio de lista no puede ser menor al precio al contado.');
    http.expectNone(baseUrl);
  });

  it('mapea errores por campo devueltos por el backend (ej. nombre duplicado)', () => {
    const fixture = TestBed.createComponent(ProductoFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirCrear();
    (comp as any).formulario.patchValue({
      nombre: 'Atún Florida 170g',
      unidad_medida: 'Lata',
      moneda: 'PEN',
      precio_contado: '5.50',
      precio_lista: '6.00',
      forma_venta_credito: 'FIN_DE_MES',
    });
    (comp as any).guardar();

    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(
      {
        detail: 'Ya existe un producto con esa descripción en su tienda.',
        errores: { nombre: 'Nombre de producto ya registrado.' },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nombre de producto ya registrado.');
  });

  it('permite editar un producto existente enviando PUT /productos/{id}', () => {
    const fixture = TestBed.createComponent(ProductoFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    let guardado: ProductoItem | undefined;
    comp.guardado.subscribe((p) => (guardado = p));

    comp.abrirEditar(PRODUCTO_EXISTENTE);
    (comp as any).formulario.controls.precio_lista.setValue('6.50');
    (comp as any).guardar();

    const req = http.expectOne(`${baseUrl}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.precio_lista).toBe('6.50');
    req.flush({ ...PRODUCTO_EXISTENTE, precio_lista: '6.50' });

    expect(guardado?.precio_lista).toBe('6.50');
  });
});
