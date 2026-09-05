import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { defaultAccounts } from '../src/config/db.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { loginId: 'admin123' },
    update: {
      passwordHash: adminPasswordHash,
      isActive: true
    },
    create: {
      loginId: 'admin123',
      name: 'Nisha Shah',
      email: 'admin@urbanfurniture.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  console.log(`Database seeded successfully. Admin user ready: ${admin.loginId} (${admin.email})`);

  for (const [code, name, type] of defaultAccounts) {
    await prisma.account.upsert({ where: { code }, update: { name, type, isActive: true }, create: { code, name, type } });
  }
  console.log(`Default chart of accounts ready: ${defaultAccounts.length} accounts`);

  const contacts = [
    ['Aarav Mehta', 'CUSTOMER', 'aarav.mehta@northstarhomes.in', '+91 98765 12001', '18 Linking Road', 'Mumbai', 'Maharashtra', '400052'],
    ['Diya Sharma', 'CUSTOMER', 'diya.sharma@oakandloom.in', '+91 98111 12002', '42 Sector 17', 'Gurugram', 'Haryana', '122001'],
    ['Rohan Kapoor', 'VENDOR', 'rohan.kapoor@heritagewoodworks.in', '+91 98201 12003', '9 Industrial Estate', 'Pune', 'Maharashtra', '411019'],
    ['Ananya Iyer', 'BOTH', 'ananya.iyer@casaform.in', '+91 98450 12004', '27 Indiranagar', 'Bengaluru', 'Karnataka', '560038'],
    ['Vikram Singh', 'CUSTOMER', 'vikram.singh@theurbanabode.in', '+91 99100 12005', '11 Golf Course Road', 'Gurugram', 'Haryana', '122002'],
    ['Meera Nair', 'VENDOR', 'meera.nair@malabarfurnishings.in', '+91 98470 12006', '6 Banerji Road', 'Kochi', 'Kerala', '682018'],
    ['Kabir Malhotra', 'CUSTOMER', 'kabir.malhotra@studioivory.in', '+91 98100 12007', '55 Hauz Khas Village', 'New Delhi', 'Delhi', '110016'],
    ['Ishita Rao', 'CUSTOMER', 'ishita.rao@habitatlane.in', '+91 99860 12008', '31 Jubilee Hills', 'Hyderabad', 'Telangana', '500033'],
    ['Arjun Desai', 'VENDOR', 'arjun.desai@teakandtone.in', '+91 98250 12009', '14 Ashram Road', 'Ahmedabad', 'Gujarat', '380009'],
    ['Sara Fernandes', 'BOTH', 'sara.fernandes@coastalliving.in', '+91 98221 12010', '8 Camp Road', 'Pune', 'Maharashtra', '411001'],
    ['Neil Joseph', 'CUSTOMER', 'neil.joseph@roomandboard.in', '+91 98460 12011', '22 Vazhuthacaud', 'Thiruvananthapuram', 'Kerala', '695014'],
    ['Pooja Bhatia', 'CUSTOMER', 'pooja.bhatia@homestory.in', '+91 98105 12012', '73 Model Town', 'New Delhi', 'Delhi', '110009'],
    ['Aditya Kulkarni', 'VENDOR', 'aditya.kulkarni@craftgrid.in', '+91 98230 12013', '4 MIDC Road', 'Nashik', 'Maharashtra', '422007'],
    ['Tara Menon', 'CUSTOMER', 'tara.menon@nestandnook.in', '+91 98471 12014', '16 Panampilly Nagar', 'Kochi', 'Kerala', '682036'],
    ['Kunal Verma', 'CUSTOMER', 'kunal.verma@formandfunction.in', '+91 98990 12015', '28 C G Road', 'Ahmedabad', 'Gujarat', '380006'],
    ['Nandini Pillai', 'BOTH', 'nandini.pillai@livinglines.in', '+91 99000 12016', '39 Koramangala', 'Bengaluru', 'Karnataka', '560034'],
    ['Yash Thakur', 'VENDOR', 'yash.thakur@woodlandsource.in', '+91 98160 12017', '12 Industrial Area', 'Chandigarh', 'Chandigarh', '160002'],
    ['Riya Chawla', 'CUSTOMER', 'riya.chawla@thedecorcollective.in', '+91 98733 12018', '24 Vasant Vihar', 'New Delhi', 'Delhi', '110057'],
    ['Manav Shah', 'CUSTOMER', 'manav.shah@lineahome.in', '+91 98240 12019', '7 Prahladnagar', 'Ahmedabad', 'Gujarat', '380015'],
    ['Aisha Khan', 'CUSTOMER', 'aisha.khan@atelierliving.in', '+91 98198 12020', '63 Bandra West', 'Mumbai', 'Maharashtra', '400050'],
    ['Siddharth Bose', 'VENDOR', 'siddharth.bose@easterncraft.in', '+91 98310 12021', '19 Salt Lake Sector V', 'Kolkata', 'West Bengal', '700091'],
    ['Lavanya Reddy', 'CUSTOMER', 'lavanya.reddy@terracasa.in', '+91 98490 12022', '5 Banjara Hills', 'Hyderabad', 'Telangana', '500034'],
    ['Dev Agarwal', 'BOTH', 'dev.agarwal@oakstreetstudio.in', '+91 98109 12023', '48 Saket', 'New Delhi', 'Delhi', '110017'],
    ['Maya Krishnan', 'CUSTOMER', 'maya.krishnan@earthandedge.in', '+91 98430 12024', '10 R S Puram', 'Coimbatore', 'Tamil Nadu', '641002'],
    ['Rahul Sethi', 'VENDOR', 'rahul.sethi@primepanels.in', '+91 98103 12025', '21 Okhla Phase II', 'New Delhi', 'Delhi', '110020'],
    ['Esha Mukherjee', 'CUSTOMER', 'esha.mukherjee@quietcorner.in', '+91 98311 12026', '33 Ballygunge', 'Kolkata', 'West Bengal', '700019'],
    ['Varun Hegde', 'CUSTOMER', 'varun.hegde@modulardwell.in', '+91 98451 12027', '17 Whitefield Main Road', 'Bengaluru', 'Karnataka', '560066'],
    ['Shruti Joshi', 'BOTH', 'shruti.joshi@craftedspaces.in', '+91 98222 12028', '29 Kalyani Nagar', 'Pune', 'Maharashtra', '411006'],
    ['Harsh Vardhan', 'VENDOR', 'harsh.vardhan@royalply.in', '+91 98710 12029', '8 Naraina Industrial Area', 'New Delhi', 'Delhi', '110028'],
    ['Neha Arora', 'CUSTOMER', 'neha.arora@havenandhall.in', '+91 98104 12030', '41 Sushant Lok', 'Gurugram', 'Haryana', '122009'],
    ['Samar Roy', 'CUSTOMER', 'samar.roy@monsooninteriors.in', '+91 98300 12031', '26 Alipore Road', 'Kolkata', 'West Bengal', '700027'],
    ['Kritika Jain', 'CUSTOMER', 'kritika.jain@roomcraft.in', '+91 98990 12032', '15 Vijay Nagar', 'Indore', 'Madhya Pradesh', '452010'],
    ['Aman Sood', 'VENDOR', 'aman.sood@timbertrail.in', '+91 98140 12033', '3 Industrial Focal Point', 'Ludhiana', 'Punjab', '141010'],
    ['Ira Banerjee', 'BOTH', 'ira.banerjee@ateliernine.in', '+91 98312 12034', '52 New Town', 'Kolkata', 'West Bengal', '700156'],
    ['Nikhil Patil', 'CUSTOMER', 'nikhil.patil@urbanframe.in', '+91 98220 12035', '38 Wakad Road', 'Pune', 'Maharashtra', '411057'],
    ['Simran Kaur', 'CUSTOMER', 'simran.kaur@nestworks.in', '+91 98720 12036', '20 Sector 22', 'Chandigarh', 'Chandigarh', '160022'],
    ['Ritesh Gupta', 'VENDOR', 'ritesh.gupta@buildandgrain.in', '+91 98108 12037', '6 Bawana Industrial Area', 'New Delhi', 'Delhi', '110039'],
    ['Aditi Sinha', 'CUSTOMER', 'aditi.sinha@softform.in', '+91 98350 12038', '14 Bailey Road', 'Patna', 'Bihar', '800001'],
    ['Omkar Shetty', 'CUSTOMER', 'omkar.shetty@shorelinehomes.in', '+91 98452 12039', '9 Kadri', 'Mangaluru', 'Karnataka', '575004'],
    ['Zoya Mirza', 'BOTH', 'zoya.mirza@thecraftedroom.in', '+91 98203 12040', '72 Powai', 'Mumbai', 'Maharashtra', '400076'],
    ['Pranav Chatterjee', 'VENDOR', 'pranav.chatterjee@bengalwood.in', '+91 98306 12041', '11 Kasba', 'Kolkata', 'West Bengal', '700042'],
    ['Rhea Dsouza', 'CUSTOMER', 'rhea.dsouza@roomtheory.in', '+91 98202 12042', '35 Colaba', 'Mumbai', 'Maharashtra', '400005'],
    ['Gaurav Bansal', 'CUSTOMER', 'gaurav.bansal@lineandgrain.in', '+91 98101 12043', '19 Rajouri Garden', 'New Delhi', 'Delhi', '110027'],
    ['Sonal Deshpande', 'VENDOR', 'sonal.deshpande@deccanwood.in', '+91 98226 12044', '23 Aundh Road', 'Pune', 'Maharashtra', '411007'],
    ['Vivek Raman', 'CUSTOMER', 'vivek.raman@oakhouse.in', '+91 98400 12045', '44 Adyar', 'Chennai', 'Tamil Nadu', '600020'],
    ['Anika Kapoor', 'BOTH', 'anika.kapoor@designledger.in', '+91 98102 12046', '60 Sector 44', 'Gurugram', 'Haryana', '122003'],
    ['Mohit Tiwari', 'VENDOR', 'mohit.tiwari@centralhardwood.in', '+91 98930 12047', '5 Rau Industrial Area', 'Indore', 'Madhya Pradesh', '453331'],
    ['Ishaan Mukherjee', 'CUSTOMER', 'ishaan.mukherjee@modernhearth.in', '+91 98308 12048', '17 Park Street', 'Kolkata', 'West Bengal', '700016'],
    ['Kavya Narang', 'CUSTOMER', 'kavya.narang@homelore.in', '+91 98107 12049', '32 Civil Lines', 'Jaipur', 'Rajasthan', '302006'],
    ['Aarushi Rao', 'VENDOR', 'aarushi.rao@artisanroute.in', '+91 99200 12050', '25 Andheri East', 'Mumbai', 'Maharashtra', '400069']
  ];

  for (const [index, [name, type, email, mobile, address, city, state, pincode]] of contacts.entries()) {
    const data = { name, type, email, mobile, address, city, state, pincode, profileImage: `https://i.pravatar.cc/300?img=${(index % 70) + 1}`, isActive: true };
    const existingContact = await prisma.contact.findFirst({ where: { email } });
    if (existingContact) {
      await prisma.contact.update({ where: { id: existingContact.id }, data });
    } else {
      await prisma.contact.create({ data });
    }
  }
  console.log(`Contact directory ready: ${contacts.length} contacts`);

  const productCategories = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor', 'Lighting & Decor'];
  const categoryRecords = {};
  for (const categoryName of productCategories) {
    categoryRecords[categoryName] = await prisma.productCategory.upsert({
      where: { name: categoryName },
      update: { isActive: true },
      create: { name: categoryName, description: `${categoryName} furniture and home furnishings` }
    });
  }

  const furnitureImages = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1617098900591-3f90928e8ae4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=600&q=80'
  ];
  const products = [
    ['UF-LR-001', 'Aster 3-Seater Sofa', 'GOODS', 'Living Room', 68900, 46800, 12, 4, 18, 0],
    ['UF-LR-002', 'Milo Lounge Chair', 'GOODS', 'Living Room', 24900, 16200, 18, 6, 18, 1],
    ['UF-LR-003', 'Nora Oak Coffee Table', 'GOODS', 'Living Room', 18900, 12100, 24, 8, 12, 2],
    ['UF-LR-004', 'Cove Two-Seater Sofa', 'GOODS', 'Living Room', 52900, 35100, 9, 3, 18, 3],
    ['UF-LR-005', 'Arlo Media Console', 'GOODS', 'Living Room', 32900, 21600, 14, 5, 18, 4],
    ['UF-LR-006', 'Luna Nesting Tables', 'COMBO', 'Living Room', 21900, 13900, 11, 4, 18, 5],
    ['UF-LR-007', 'Haven Modular Sectional', 'GOODS', 'Living Room', 114900, 78900, 5, 2, 18, 0],
    ['UF-LR-008', 'Sora Accent Cabinet', 'GOODS', 'Living Room', 27900, 18100, 13, 4, 18, 1],
    ['UF-BR-001', 'Mira Queen Bed', 'GOODS', 'Bedroom', 74900, 49800, 8, 3, 18, 4],
    ['UF-BR-002', 'Mira King Bed', 'GOODS', 'Bedroom', 89900, 59900, 6, 2, 18, 5],
    ['UF-BR-003', 'Eden Two-Drawer Bedside', 'GOODS', 'Bedroom', 14900, 9200, 22, 7, 18, 6],
    ['UF-BR-004', 'Rhea Six-Drawer Dresser', 'GOODS', 'Bedroom', 41900, 27800, 10, 3, 18, 7],
    ['UF-BR-005', 'Alto Sliding Wardrobe', 'GOODS', 'Bedroom', 68900, 45800, 7, 2, 18, 8],
    ['UF-BR-006', 'Cloud Upholstered Bench', 'GOODS', 'Bedroom', 16900, 10400, 16, 5, 12, 9],
    ['UF-BR-007', 'Orion Dressing Table', 'GOODS', 'Bedroom', 28900, 18700, 12, 4, 18, 4],
    ['UF-BR-008', 'Vale Solid Wood Chest', 'GOODS', 'Bedroom', 37900, 24900, 8, 3, 18, 5],
    ['UF-DN-001', 'Elm Six-Seater Dining Table', 'GOODS', 'Dining', 57900, 38900, 8, 3, 18, 6],
    ['UF-DN-002', 'Elm Dining Chair', 'GOODS', 'Dining', 8900, 5400, 42, 12, 12, 7],
    ['UF-DN-003', 'Wren Four-Seater Table', 'GOODS', 'Dining', 38900, 25600, 11, 4, 18, 8],
    ['UF-DN-004', 'Wren Dining Bench', 'GOODS', 'Dining', 15900, 9900, 18, 6, 12, 9],
    ['UF-DN-005', 'Pia Cane Bar Stool', 'GOODS', 'Dining', 10900, 6700, 26, 8, 12, 0],
    ['UF-DN-006', 'Siena Sideboard', 'GOODS', 'Dining', 46900, 30800, 9, 3, 18, 1],
    ['UF-DN-007', 'Hugo Kitchen Island', 'GOODS', 'Dining', 79900, 53900, 4, 2, 18, 2],
    ['UF-DN-008', 'Marlow Dining Set', 'COMBO', 'Dining', 88900, 59900, 5, 2, 18, 3],
    ['UF-OF-001', 'Atlas Executive Desk', 'GOODS', 'Office', 64900, 42900, 7, 3, 18, 4],
    ['UF-OF-002', 'Linea Writing Desk', 'GOODS', 'Office', 28900, 17900, 15, 5, 18, 5],
    ['UF-OF-003', 'Herman Ergonomic Chair', 'GOODS', 'Office', 24900, 15800, 21, 7, 18, 6],
    ['UF-OF-004', 'Aero Visitor Chair', 'GOODS', 'Office', 12900, 7900, 28, 9, 12, 7],
    ['UF-OF-005', 'Grid Filing Cabinet', 'GOODS', 'Office', 21900, 13900, 13, 4, 18, 8],
    ['UF-OF-006', 'Kepler Bookcase', 'GOODS', 'Office', 35900, 23100, 10, 3, 18, 9],
    ['UF-OF-007', 'Nexa Standing Desk', 'GOODS', 'Office', 46900, 31900, 8, 3, 18, 0],
    ['UF-OF-008', 'Pivot Meeting Table', 'GOODS', 'Office', 73900, 48900, 4, 2, 18, 1],
    ['UF-OT-001', 'Verde Garden Lounge Set', 'COMBO', 'Outdoor', 72900, 48900, 6, 2, 18, 2],
    ['UF-OT-002', 'Breeze Outdoor Armchair', 'GOODS', 'Outdoor', 18900, 11900, 18, 6, 18, 3],
    ['UF-OT-003', 'Terra Patio Dining Table', 'GOODS', 'Outdoor', 42900, 27900, 9, 3, 18, 4],
    ['UF-OT-004', 'Coast Folding Sun Lounger', 'GOODS', 'Outdoor', 15900, 9800, 20, 7, 18, 5],
    ['UF-OT-005', 'Ivy Balcony Bistro Set', 'COMBO', 'Outdoor', 29900, 19200, 12, 4, 18, 6],
    ['UF-LD-001', 'Halo Arch Floor Lamp', 'GOODS', 'Lighting & Decor', 12900, 7800, 24, 8, 18, 7],
    ['UF-LD-002', 'Luma Pendant Light', 'GOODS', 'Lighting & Decor', 8900, 5200, 31, 10, 18, 8],
    ['UF-LD-003', 'Ridge Table Lamp', 'GOODS', 'Lighting & Decor', 5900, 3300, 36, 12, 12, 9],
    ['UF-LD-004', 'Arc Wall Shelf', 'GOODS', 'Lighting & Decor', 7900, 4600, 27, 9, 18, 0],
    ['UF-LD-005', 'Mosaic Entry Mirror', 'GOODS', 'Lighting & Decor', 14900, 8900, 19, 6, 18, 1],
    ['UF-LD-006', 'Cedar Planter Stand', 'GOODS', 'Lighting & Decor', 6900, 3900, 25, 8, 12, 2],
    ['UF-LD-007', 'Frame Ladder Towel Rack', 'GOODS', 'Lighting & Decor', 9900, 5900, 17, 6, 18, 3],
    ['UF-LD-008', 'Nook Upholstered Pouf', 'GOODS', 'Lighting & Decor', 10900, 6500, 23, 8, 18, 4],
    ['UF-LD-009', 'Woven Storage Basket Set', 'COMBO', 'Lighting & Decor', 6900, 4100, 32, 10, 12, 5]
  ];

  for (const [sku, name, type, category, salesPrice, purchasePrice, stockQuantity, reorderLevel, taxRate, imageIndex] of products) {
    const data = { name, type, categoryId: categoryRecords[category].id, salesPrice, purchasePrice, stockQuantity, reorderLevel, taxRate, imageUrl: furnitureImages[imageIndex], isActive: true };
    await prisma.product.upsert({ where: { sku }, update: data, create: { sku, ...data } });
  }
  console.log(`Furniture product catalog ready: ${products.length} products`);
}

main()
  .catch(error => {
    console.error('Seed error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
