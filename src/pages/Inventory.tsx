import React, { useState } from 'react';
import { Package, Plus, Search, Filter, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/src/components/ui/Table';
import { formatCurrency, cn } from '@/src/lib/utils';
import { Product } from '@/src/types/index';
import { useData } from '@/src/context/DataContext';
import { toast } from 'sonner';

export default function Inventory() {
    const { products, addProduct: saveProduct, updateProduct: editProduct, deleteProduct: removeProduct } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        if (!deletingProduct) return;
        setIsDeleting(true);
        try {
            await removeProduct(deletingProduct.id);
            toast.success('পণ্যটি এবং এর সাথে সম্পর্কিত সকল তথ্য সফলভাবে মুছে ফেলা হয়েছে!');
            setDeletingProduct(null);
        } catch (error: any) {
            console.error('Failed to delete product:', error);
            toast.error(error.message || 'পণ্য মুছে ফেলতে সমস্যা হয়েছে');
        } finally {
            setIsDeleting(false);
        }
    };

    // Simple add product function for frontend demo
    const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newProduct: Product = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.get('name') as string,
            sku: formData.get('sku') as string,
            category: formData.get('category') as string,
            price: Number(formData.get('price')),
            stock: Number(formData.get('stock')),
            minStock: Number(formData.get('minStock')),
            createdAt: new Date().toISOString(),
        };

        setIsSaving(true);
        try {
            await saveProduct(newProduct);
            toast.success('পণ্যটি সফলভাবে যোগ করা হয়েছে!');
            setIsAdding(false);
        } catch (error: any) {
            console.error('Failed to save product:', error);
            toast.error(error.message || 'পণ্য যোগ করতে সমস্যা হয়েছে');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingProduct) return;
        const formData = new FormData(e.currentTarget);
        const updatedProduct: Product = {
            ...editingProduct,
            name: formData.get('name') as string,
            sku: formData.get('sku') as string,
            category: formData.get('category') as string,
            price: Number(formData.get('price')),
            stock: Number(formData.get('stock')),
            minStock: Number(formData.get('minStock')),
        };

        setIsUpdating(true);
        try {
            await editProduct(updatedProduct);
            toast.success('পণ্যটি সফলভাবে আপডেট করা হয়েছে!');
            setEditingProduct(null);
        } catch (error: any) {
            console.error('Failed to update product:', error);
            toast.error(error.message || 'পণ্য আপডেট করতে সমস্যা হয়েছে');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight italic serif">ইনভেন্টরি</h1>
                    <p className="text-slate-500 font-medium tracking-tight">আপনার দোকানে মোট {products.length}টি পণ্য রয়েছে</p>
                </div>
                <Button onClick={() => { setIsAdding(true); setEditingProduct(null); }}>
                    <Plus size={18} className="mr-2" />
                    নতুন পণ্য যোগ করুন
                </Button>
            </div>

            {isAdding && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic">নতুন পণ্যের বিবরণ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddProduct} className="grid gap-4 md:grid-cols-3">
                            <Input name="name" label="পণ্যের নাম" placeholder="যেমন: অয়ারলেস মাউস" required />
                            <Input name="sku" label="এসকেইউ (SKU)" placeholder="SKU-123" required />
                            <Input name="category" label="ক্যাটাগরি" placeholder="যেমন: ইলেকট্রনিক্স" required />
                            <Input name="price" type="number" label="বিক্রয় মূল্য (৳)" placeholder="0.00" required />
                            <Input name="stock" type="number" label="স্টক পরিমাণ" placeholder="0" required />
                            <Input name="minStock" type="number" label="ন্যূনতম স্টক এলার্ট" placeholder="5" required />
                            <div className="md:col-span-3 flex justify-end gap-2 text-sm font-bold">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isSaving}>বাতিল</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'পণ্য যোগ করুন'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {editingProduct && (
                <Card className="border-emerald-200 bg-emerald-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic text-emerald-800">পণ্যের বিবরণ আপডেট করুন</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleEditProduct} className="grid gap-4 md:grid-cols-3" key={editingProduct.id}>
                            <Input name="name" label="পণ্যের নাম" defaultValue={editingProduct.name} required />
                            <Input name="sku" label="এসকেইউ (SKU)" defaultValue={editingProduct.sku} required />
                            <Input name="category" label="ক্যাটাগরি" defaultValue={editingProduct.category} required />
                            <Input name="price" type="number" label="বিক্রয় মূল্য (৳)" defaultValue={editingProduct.price} required />
                            <Input name="stock" type="number" label="স্টক পরিমাণ" defaultValue={editingProduct.stock} required />
                            <Input name="minStock" type="number" label="ন্যূনতম স্টক এলার্ট" defaultValue={editingProduct.minStock} required />
                            <div className="md:col-span-3 flex justify-end gap-2 text-sm font-bold">
                                <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)} disabled={isUpdating}>বাতিল</Button>
                                <Button type="submit" disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isUpdating ? 'আপডেট হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {deletingProduct && (
                <Card className="border-rose-200 bg-rose-50/30">
                    <CardHeader>
                        <CardTitle className="serif italic text-rose-800 flex items-center gap-2">
                            <AlertTriangle className="text-rose-600" size={20} />
                            পণ্য মুছে ফেলার সতর্কতা
                        </CardTitle>
                        <CardDescription className="text-rose-700 font-bold">
                            আপনি কি নিশ্চিত যে আপনি <span className="underline">{deletingProduct.name}</span> পণ্যটি মুছে ফেলতে চান?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-700 font-bold">
                            ⚠️ সতর্কীকরণ: এই পণ্যটি মুছে ফেললে এর সাথে সম্পর্কিত সকল বিক্রয় (sales) এবং ড্যাশবোর্ড ও রিপোর্ট সংক্রান্ত রেকর্ড স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা সম্ভব নয়।
                        </p>
                        <div className="flex justify-end gap-2 text-sm font-bold">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setDeletingProduct(null)} 
                                disabled={isDeleting}
                            >
                                বাতিল করুন
                            </Button>
                            <Button 
                                type="button" 
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold" 
                                onClick={handleConfirmDelete} 
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, নিশ্চিত মুছুন'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input 
                                placeholder="নাম বা SKU দিয়ে পণ্য খুঁজুন..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead>পণ্যের নাম</TableHead>
                                <TableHead>এসকেইউ (SKU)</TableHead>
                                <TableHead>ক্যাটাগরি</TableHead>
                                <TableHead className="text-right">মূল্য</TableHead>
                                <TableHead className="text-center">স্টক</TableHead>
                                <TableHead className="text-right">একশন</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-bold text-slate-900">
                                        <div className="flex flex-col">
                                            <span>{product.name}</span>
                                            {product.stock <= product.minStock && (
                                                <span className="flex items-center gap-1 text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-1">
                                                    <AlertTriangle size={10} />
                                                    স্টক খুব কম
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-500 uppercase text-xs">{product.sku}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 uppercase">
                                            {product.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-slate-900">
                                        {formatCurrency(product.price)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                       <span className={cn(
                                           "font-mono font-bold",
                                           product.stock <= product.minStock ? "text-rose-600" : "text-slate-900"
                                       )}>
                                            {product.stock}
                                       </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-indigo-600 font-bold px-2 py-1"
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    setIsAdding(false);
                                                    setDeletingProduct(null);
                                                }}
                                            >
                                                এডিট
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-rose-600 font-bold hover:bg-rose-50 hover:text-rose-700 px-2 py-1 flex items-center gap-1"
                                                onClick={() => {
                                                    setDeletingProduct(product);
                                                    setEditingProduct(null);
                                                    setIsAdding(false);
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                মুছুন
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic font-medium">
                                        কোনো পণ্য পাওয়া যায়নি। পণ্য যোগ করতে "নতুন পণ্য যোগ করুন" বাটনে ক্লিক করুন।
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
