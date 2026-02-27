from pydantic import BaseModel
from datetime import datetime

class KullaniciCreate(BaseModel):
    isim: str
    email: str

class KullaniciResponse(BaseModel):
    id: int
    isim: str
    email: str

    model_config = {"from_attributes": True}

class HesapCreate(BaseModel):
    ad: str
    bakiye: float = 0.0
    kullanici_id: int

class HesapResponse(BaseModel):
    id: int
    ad: str
    bakiye: float
    kullanici_id: int

    model_config = {"from_attributes": True}

class KategoriCreate(BaseModel):
    ad: str

class KategoriResponse(BaseModel):
    id: int
    ad: str

    model_config = {"from_attributes": True}

class IslemCreate(BaseModel):
    tutar: float
    aciklama: str
    hesap_id: int
    kategori_adi: str  # DİKKAT: Artık ID değil, kullanıcının yazdığı metni (string) alıyoruz!

class IslemResponse(BaseModel):
    id: int
    tutar: float
    tarih: datetime
    aciklama: str
    hesap_id: int
    kategori_id: int

    model_config = {"from_attributes": True}