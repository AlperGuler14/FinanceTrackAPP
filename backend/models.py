from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Kullanici(Base):
    __tablename__ = "kullanicilar"

    id = Column(Integer, primary_key=True, index=True)
    isim = Column(String, index=True)
    email = Column(String, unique=True, index=True)


class Hesap(Base):
    __tablename__ = "hesaplar"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String)
    bakiye = Column(Float, default=0.0)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"))


class Kategori(Base):
    __tablename__ = "kategoriler"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String)


class Islem(Base):
    __tablename__ = "islemler"

    id = Column(Integer, primary_key=True, index=True)
    tutar = Column(Float)
    tarih = Column(DateTime, default=datetime.utcnow)
    aciklama = Column(String)

    hesap_id = Column(Integer, ForeignKey("hesaplar.id"))
    kategori_id = Column(Integer, ForeignKey("kategoriler.id"))